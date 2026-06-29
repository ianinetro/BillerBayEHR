"""
Claims models for ClinicTraq.

Covers the full lifecycle of a professional (837P) or institutional (837I)
claim, from draft through adjudication.

Claim ID format: BB-YYYY-XXXXXX  (prefix BB- + 4-digit year + 6-digit zero-padded number)
"""

from django.db import models
from patients.models import Patient


class Claim(models.Model):
    """
    A single insurance claim tied to a patient and optional visit.
    """

    class ClaimType(models.TextChoices):
        P837 = "837P", "837P (Professional)"
        I837 = "837I", "837I (Institutional)"

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        VALIDATION_FAILED = "Validation failed", "Validation failed"
        READY_TO_SUBMIT = "Ready to submit", "Ready to submit"
        SUBMITTED = "Submitted", "Submitted"
        ACCEPTED = "Accepted", "Accepted"
        REJECTED = "Rejected", "Rejected"
        DENIED = "Denied", "Denied"
        PARTIALLY_PAID = "Partially paid", "Partially paid"
        PAID = "Paid", "Paid"
        CLOSED = "Closed", "Closed"

    class ValidationStatus(models.TextChoices):
        NEEDS_RUN = "Needs run", "Needs run"
        PASSED = "Passed", "Passed"
        BLOCKING = "Blocking", "Blocking"
        WARNING = "Warning", "Warning"

    class SubmissionStatus(models.TextChoices):
        NOT_SUBMITTED = "Not submitted", "Not submitted"
        DRAFT = "Draft", "Draft"
        SUBMITTED = "Submitted", "Submitted"
        ACCEPTED = "Accepted", "Accepted"
        REJECTED = "Rejected", "Rejected"

    # Identifiers
    claim_id = models.CharField(max_length=20, unique=True, editable=False, db_index=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Service info
    date_of_service = models.DateField()
    patient = models.ForeignKey(
        Patient, on_delete=models.PROTECT, related_name="claims"
    )
    visit = models.ForeignKey(
        "visits.Visit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="claims",
    )

    # Provider / facility / payer
    provider = models.CharField(max_length=255)
    facility = models.CharField(max_length=255)
    payer = models.CharField(max_length=255)
    payer_id_on_file = models.CharField(max_length=100)

    # Claim type
    claim_type = models.CharField(
        max_length=10, choices=ClaimType.choices, default=ClaimType.P837
    )

    # Financials
    charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Status fields
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.DRAFT
    )
    validation_status = models.CharField(
        max_length=20,
        choices=ValidationStatus.choices,
        default=ValidationStatus.NEEDS_RUN,
    )
    submission_status = models.CharField(
        max_length=20,
        choices=SubmissionStatus.choices,
        default=SubmissionStatus.NOT_SUBMITTED,
    )

    # Misc
    last_response = models.TextField(blank=True, default="")
    assigned_to = models.CharField(max_length=255, blank=True, default="")
    is_primary = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Claim"
        verbose_name_plural = "Claims"

    def __str__(self):
        return f"{self.claim_id} — {self.patient} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.claim_id:
            from django.utils import timezone

            year = timezone.now().year
            last = (
                Claim.objects.filter(claim_id__startswith=f"BB-{year}-")
                .order_by("claim_id")
                .last()
            )
            if last:
                try:
                    seq = int(last.claim_id.split("-")[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
            self.claim_id = f"BB-{year}-{seq:06d}"
        super().save(*args, **kwargs)


class ClaimValidationIssue(models.Model):
    """
    A single validation finding on a claim (blocking, warning, or informational).
    """

    class Severity(models.TextChoices):
        BLOCKING = "Blocking", "Blocking"
        WARNING = "Warning", "Warning"
        INFO = "Info", "Info"

    claim = models.ForeignKey(
        Claim, on_delete=models.CASCADE, related_name="validation_issues"
    )
    severity = models.CharField(max_length=10, choices=Severity.choices)
    issue = models.CharField(max_length=500)
    location = models.CharField(max_length=255)
    why_it_matters = models.TextField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["severity", "created_at"]
        verbose_name = "Claim Validation Issue"
        verbose_name_plural = "Claim Validation Issues"

    def __str__(self):
        return f"[{self.severity}] {self.issue} on {self.claim.claim_id}"


class ClaimSubmissionHistory(models.Model):
    """
    A record of every EDI transaction sent or received for a claim.
    """

    class SubmissionType(models.TextChoices):
        P837 = "837P", "837P (Claim)"
        CA277 = "277CA", "277CA (Acknowledgment)"
        N999 = "999", "999 (Functional Ack)"
        N835 = "835", "835 (Remittance)"

    claim = models.ForeignKey(
        Claim, on_delete=models.CASCADE, related_name="submission_history"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    submission_type = models.CharField(max_length=10, choices=SubmissionType.choices)
    status = models.CharField(max_length=100)
    control_number = models.CharField(max_length=50, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "Claim Submission History"
        verbose_name_plural = "Claim Submission Histories"

    def __str__(self):
        return f"{self.submission_type} for {self.claim.claim_id} at {self.submitted_at}"
