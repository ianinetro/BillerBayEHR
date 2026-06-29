from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import ERAException, Payment, PaymentApplication
from .serializers import ERAExceptionSerializer, PaymentApplicationSerializer, PaymentSerializer


def _is_zip(data: bytes) -> bool:
    return data[:2] == b"PK"


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

        total_applied = sum(a.amount for a in payment.applications.filter(reversed=False))
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

        total_applied = sum(a.amount for a in payment.applications.filter(reversed=False))
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

    @action(detail=False, methods=["post"], url_path="import-era", parser_classes=[MultiPartParser])
    def import_era(self, request):
        """
        Accept an 835 ERA file upload (raw EDI, ZIP archive, or spreadsheet),
        create a Payment record, and trigger async processing.

        Accepts:
          - .835 / .edi / .txt  — raw X12 EDI
          - .zip               — ZIP archive containing a .835 file (OfficeAlly bundle)
        """
        era_file = request.FILES.get("file")
        if not era_file:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        raw_bytes = era_file.read()

        # ZIP detection: extract the .835 from the archive before storing content
        filename = era_file.name or "era.835"
        if _is_zip(raw_bytes) or filename.lower().endswith(".zip"):
            from edi.parsers.x12_835_parser import extract_835_from_zip
            try:
                file_content = extract_835_from_zip(raw_bytes)
                filename = filename.rsplit(".", 1)[0] + ".835"
            except ValueError as e:
                return Response(
                    {"detail": f"ZIP extraction failed: {e}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            file_content = raw_bytes.decode("utf-8", errors="replace")

        payment = Payment.objects.create(
            payment_date=timezone.now().date(),
            payer_type=Payment.PayerType.INSURANCE,
            payer_name="ERA Import",
            method=Payment.Method.EFT,
            amount=0,
            source=Payment.Source.ERA,
            era_file=filename,
            status=Payment.Status.DRAFT,
        )

        from payments.tasks import process_era_file
        process_era_file.delay(payment.pk, file_content)

        return Response(
            {"detail": "ERA file received. Processing in background.", "payment_id": payment.payment_id},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=False, methods=["get"], url_path="era-dashboard")
    def era_dashboard(self, request):
        """
        Summary statistics for the ERA 835 dashboard.

        Returns KPI cards, by-payer breakdown, and top denial reasons.
        """
        era_payments = Payment.objects.filter(source=Payment.Source.ERA)

        total_payments = era_payments.count()
        total_amount = era_payments.aggregate(s=Sum("amount"))["s"] or Decimal("0")
        total_applied = era_payments.aggregate(s=Sum("applied"))["s"] or Decimal("0")
        total_unapplied = era_payments.aggregate(s=Sum("unapplied"))["s"] or Decimal("0")

        unresolved_exceptions = ERAException.objects.filter(resolved=False)
        unresolved_count = unresolved_exceptions.count()
        unresolved_amount = unresolved_exceptions.aggregate(s=Sum("paid_amount"))["s"] or Decimal("0")

        status_breakdown = list(
            era_payments.values("status")
            .annotate(count=Count("id"), amount=Sum("amount"))
            .order_by("-count")
        )

        by_payer = list(
            era_payments.values("payer_name")
            .annotate(
                count=Count("id"),
                total=Sum("amount"),
                applied=Sum("applied"),
                unapplied=Sum("unapplied"),
            )
            .order_by("-total")[:10]
        )

        top_denial_reasons = list(
            ERAException.objects.filter(resolved=False)
            .values("adjustment_reason")
            .annotate(
                count=Count("id"),
                amount=Sum("paid_amount"),
            )
            .order_by("-count")[:10]
        )

        top_denial_groups = list(
            ERAException.objects.filter(resolved=False, adjustment_group__gt="")
            .values("adjustment_group")
            .annotate(count=Count("id"), amount=Sum("paid_amount"))
            .order_by("-count")
        )

        recent_payments = list(
            era_payments.order_by("-payment_date", "-created_at")
            .values(
                "payment_id", "payment_date", "payer_name",
                "amount", "applied", "unapplied", "status",
            )[:10]
        )

        return Response(
            {
                "kpis": {
                    "total_era_payments": total_payments,
                    "total_amount": str(total_amount),
                    "total_applied": str(total_applied),
                    "total_unapplied": str(total_unapplied),
                    "unresolved_exceptions": unresolved_count,
                    "unresolved_exception_amount": str(unresolved_amount),
                },
                "status_breakdown": status_breakdown,
                "by_payer": by_payer,
                "top_denial_reasons": top_denial_reasons,
                "top_denial_groups": top_denial_groups,
                "recent_payments": recent_payments,
            }
        )

    @action(detail=False, methods=["get"], url_path="era-exceptions")
    def era_exceptions(self, request):
        """
        Paginated list of unresolved ERA exceptions across all ERA payments.
        Supports ?resolved=true|false and ?payment_id= filtering.
        """
        qs = ERAException.objects.select_related("payment", "possible_match_claim")

        resolved = request.query_params.get("resolved")
        if resolved is not None:
            qs = qs.filter(resolved=resolved.lower() == "true")

        payment_id = request.query_params.get("payment_id")
        if payment_id:
            qs = qs.filter(payment__payment_id=payment_id)

        page_size = min(int(request.query_params.get("page_size", 50)), 200)
        page = max(int(request.query_params.get("page", 1)), 1)
        total = qs.count()
        items = qs[(page - 1) * page_size: page * page_size]
        serializer = ERAExceptionSerializer(items, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )
