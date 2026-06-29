from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Claim, ClaimValidationIssue, ClaimSubmissionHistory
from .serializers import ClaimSerializer, ClaimValidationIssueSerializer


class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.select_related("patient", "visit").prefetch_related(
        "validation_issues", "submission_history"
    ).all()
    serializer_class = ClaimSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "claim_id",
        "patient__last_name",
        "patient__first_name",
        "payer",
        "provider",
    ]
    filterset_fields = ["status", "payer", "validation_status", "submission_status", "claim_type"]
    ordering_fields = ["created_at", "updated_at", "date_of_service", "charges", "balance"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"], url_path="validate")
    def validate_claim(self, request, pk=None):
        """
        Run server-side validation rules on a claim and persist the findings.
        Returns the list of ClaimValidationIssue records created.
        """
        claim = self.get_object()

        # Clear prior issues before re-running
        claim.validation_issues.all().delete()

        issues = []

        # --- Rule: patient must have active insurance on file ---
        has_insurance = claim.patient.insurances.filter(
            coverage_status="Active"
        ).exists() if hasattr(claim.patient, "insurances") else False
        if not has_insurance:
            issues.append(
                ClaimValidationIssue(
                    claim=claim,
                    severity=ClaimValidationIssue.Severity.BLOCKING,
                    issue="No active insurance on file for patient",
                    location="Patient > Insurance",
                    why_it_matters=(
                        "A claim cannot be submitted without a valid payer. "
                        "Add or verify the patient's insurance before submitting."
                    ),
                )
            )

        # --- Rule: payer_id_on_file must not be blank ---
        if not claim.payer_id_on_file.strip():
            issues.append(
                ClaimValidationIssue(
                    claim=claim,
                    severity=ClaimValidationIssue.Severity.BLOCKING,
                    issue="Payer ID is missing",
                    location="Claim > Payer ID on file",
                    why_it_matters=(
                        "The payer ID (NPI or legacy ID) is required for electronic submission."
                    ),
                )
            )

        # --- Rule: charges must be > 0 ---
        if claim.charges <= 0:
            issues.append(
                ClaimValidationIssue(
                    claim=claim,
                    severity=ClaimValidationIssue.Severity.BLOCKING,
                    issue="Total charges are zero or negative",
                    location="Claim > Charges",
                    why_it_matters=(
                        "A claim must have at least one service line with a positive billed amount."
                    ),
                )
            )

        # --- Rule: provider must be set ---
        if not claim.provider.strip():
            issues.append(
                ClaimValidationIssue(
                    claim=claim,
                    severity=ClaimValidationIssue.Severity.BLOCKING,
                    issue="Rendering provider is missing",
                    location="Claim > Provider",
                    why_it_matters=(
                        "The NPI and name of the rendering provider are required on box 24J / 33."
                    ),
                )
            )

        ClaimValidationIssue.objects.bulk_create(issues)

        has_blocking = any(i.severity == ClaimValidationIssue.Severity.BLOCKING for i in issues)
        has_warning = any(i.severity == ClaimValidationIssue.Severity.WARNING for i in issues)

        if has_blocking:
            new_validation_status = Claim.ValidationStatus.BLOCKING
        elif has_warning:
            new_validation_status = Claim.ValidationStatus.WARNING
        else:
            new_validation_status = Claim.ValidationStatus.PASSED

        claim.validation_status = new_validation_status
        if not has_blocking and claim.status == Claim.Status.DRAFT:
            new_status = Claim.Status.READY_TO_SUBMIT
        elif has_blocking:
            new_status = Claim.Status.VALIDATION_FAILED
        else:
            new_status = claim.status
        claim.status = new_status
        claim.save(update_fields=["validation_status", "status", "updated_at"])

        serializer = ClaimValidationIssueSerializer(
            claim.validation_issues.all(), many=True
        )
        return Response(
            {
                "claim_id": claim.claim_id,
                "validation_status": claim.validation_status,
                "status": claim.status,
                "issues": serializer.data,
            }
        )

    @action(detail=True, methods=["post"], url_path="submit")
    def submit_claim(self, request, pk=None):
        """
        Mark a claim as submitted and record the submission history entry.
        In production this would dispatch the 837 to the clearinghouse.
        """
        claim = self.get_object()

        if claim.validation_status == Claim.ValidationStatus.BLOCKING:
            return Response(
                {"detail": "Claim has blocking validation issues and cannot be submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if claim.submission_status == Claim.SubmissionStatus.SUBMITTED:
            return Response(
                {"detail": "Claim has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        history = ClaimSubmissionHistory.objects.create(
            claim=claim,
            submission_type=claim.claim_type,
            status="Submitted — awaiting acknowledgment",
            notes=request.data.get("notes", ""),
        )

        claim.submission_status = Claim.SubmissionStatus.SUBMITTED
        claim.status = Claim.Status.SUBMITTED
        claim.save(update_fields=["submission_status", "status", "updated_at"])

        return Response(
            {
                "claim_id": claim.claim_id,
                "status": claim.status,
                "submission_status": claim.submission_status,
                "history_id": history.pk,
            }
        )
