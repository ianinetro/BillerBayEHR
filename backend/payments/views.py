from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment, PaymentApplication, ERAException
from .serializers import PaymentSerializer, PaymentApplicationSerializer, ERAExceptionSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.prefetch_related("applications", "era_exceptions").all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["payment_id", "payer_name", "check_auth_number", "era_file"]
    filterset_fields = ["status", "payer_type", "method", "source"]
    ordering_fields = ["payment_date", "amount", "created_at"]
    ordering = ["-payment_date"]

    @action(detail=True, methods=["post"], url_path="auto-post-era")
    def auto_post_era(self, request, pk=None):
        """
        Attempt automatic posting of an ERA payment by matching ERA line items
        to claims in the database.  Unmatched lines remain as ERAException records.
        Returns counts of posted applications and remaining exceptions.
        """
        payment = self.get_object()

        if payment.source != Payment.Source.ERA:
            return Response(
                {"detail": "auto_post_era is only valid for 835 ERA payments."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from claims.models import Claim

        posted_count = 0
        exception_count = 0

        unresolved_exceptions = payment.era_exceptions.filter(resolved=False)
        for exc in unresolved_exceptions:
            claim = None
            try:
                claim = Claim.objects.get(claim_id=exc.claim_id_on_era)
            except Claim.DoesNotExist:
                qs = Claim.objects.filter(date_of_service=exc.dos)
                if qs.count() == 1:
                    claim = qs.first()
                    exc.possible_match_claim = claim
                    exc.confidence_pct = 70
                    exc.save(update_fields=["possible_match_claim", "confidence_pct"])

            if claim:
                PaymentApplication.objects.create(
                    payment=payment,
                    claim=claim,
                    amount=exc.paid_amount,
                    application_type=PaymentApplication.ApplicationType.INSURANCE_PAYMENT,
                    posted_by="auto",
                    notes=f"Auto-posted from ERA exception {exc.pk}",
                )
                exc.resolved = True
                exc.save(update_fields=["resolved"])
                posted_count += 1
            else:
                exception_count += 1

        total_applied = sum(
            a.amount for a in payment.applications.filter(reversed=False)
        )
        payment.applied = total_applied
        payment.unapplied = payment.amount - total_applied
        if exception_count == 0 and payment.unapplied == 0:
            payment.status = Payment.Status.POSTED
        elif posted_count > 0:
            payment.status = Payment.Status.POSTED_WITH_WARNINGS
        payment.save(update_fields=["applied", "unapplied", "status", "updated_at"])

        return Response(
            {
                "payment_id": payment.payment_id,
                "posted_applications": posted_count,
                "remaining_exceptions": exception_count,
                "status": payment.status,
            }
        )

    @action(detail=True, methods=["post"], url_path="match-exception")
    def match_exception(self, request, pk=None):
        """
        Manually resolve a single ERAException by specifying the correct claim.

        Expected request body:
            { "exception_id": <int>, "claim_id": "<BB-YYYY-XXXXXX>" }
        """
        payment = self.get_object()
        exception_id = request.data.get("exception_id")
        claim_id_str = request.data.get("claim_id")

        if not exception_id or not claim_id_str:
            return Response(
                {"detail": "Both exception_id and claim_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            exc = ERAException.objects.get(pk=exception_id, payment=payment)
        except ERAException.DoesNotExist:
            return Response(
                {"detail": "Exception not found on this payment."},
                status=status.HTTP_404_NOT_FOUND,
            )

        from claims.models import Claim

        try:
            claim = Claim.objects.get(claim_id=claim_id_str)
        except Claim.DoesNotExist:
            return Response(
                {"detail": f"Claim {claim_id_str} not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        app = PaymentApplication.objects.create(
            payment=payment,
            claim=claim,
            amount=exc.paid_amount,
            application_type=PaymentApplication.ApplicationType.INSURANCE_PAYMENT,
            posted_by=request.data.get("posted_by", "manual"),
            notes=request.data.get("notes", ""),
        )
        exc.resolved = True
        exc.possible_match_claim = claim
        exc.confidence_pct = 100
        exc.save(update_fields=["resolved", "possible_match_claim", "confidence_pct"])

        total_applied = sum(
            a.amount for a in payment.applications.filter(reversed=False)
        )
        payment.applied = total_applied
        payment.unapplied = payment.amount - total_applied
        payment.save(update_fields=["applied", "unapplied", "updated_at"])

        return Response(
            {
                "payment_id": payment.payment_id,
                "application_id": app.pk,
                "exception_resolved": True,
            }
        )
