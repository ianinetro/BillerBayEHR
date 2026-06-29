"""
Payments models for ClinicTraq.

Covers standalone payment records, per-claim/visit application lines, and
ERA exception items that could not be auto-matched during 835 processing.

Payment ID format: PMT-XXXX  (prefix PMT- + 4-digit zero-padded sequence)
"""

from django.db import models
from patients.models import Patient
from claims.models import Claim


class Payment(models.Model):
    """
    A single remittance or patient payment event.
    """

    class PayerType(models.TextChoices):
        INSURANCE = "Insurance", "Insurance"
        PATIENT = "Patient", "Patient"

    class Method(models.TextChoices):
        EFT = "EFT", "EFT"
        CHECK = "Check", "Check"
        CARD = "Card", "Card"
        CASH = "Cash", "Cash"
        OTHER = "Other", "Other"

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        UNMATCHED = "Unmatched", "Unmatched"
        MATCHED = "Matched", "Matched"
        POSTED = "Posted", "Posted"
        POSTED_WITH_WARNINGS = "Posted with warnings", "Posted with warnings"
        RECONCILED = "Reconciled", "Reconciled"
        REVERSED = "Reversed", "Reversed"

    class Source(models.TextChoices):
        ERA = "835 ERA", "835 ERA"
        MANUAL = "Manual", "Manual"
        EOB = "EOB", "EOB"

    # Identifiers
    payment_id = models.CharField(max_length=20, unique=True, editable=False, db_index=True)

    # Timestamps
    payment_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Payer info
    payer_type = models.CharField(max_length=20, choices=PayerType.choices)
    payer_name = models.CharField(max_length=255)

    # Method / reference
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.EFT)
    check_auth_number = models.CharField(max_length=100, blank=True, default="")

    # Financials
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    applied = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unapplied = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Status / source
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    era_file = models.CharField(max_length=255, blank=True, default="")

    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"{self.payment_id} — {self.payer_name} ${self.amount} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.payment_id:
            last = Payment.objects.order_by("payment_id").last()
            if last:
                try:
                    seq = int(last.payment_id.split("-")[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
            self.payment_id = f"PMT-{seq:04d}"
        super().save(*args, **kwargs)


class PaymentApplication(models.Model):
    """
    A portion of a Payment applied to a specific claim, visit, or patient balance.
    """

    class ApplicationType(models.TextChoices):
        INSURANCE_PAYMENT = "Insurance payment", "Insurance payment"
        PATIENT_PAYMENT = "Patient payment", "Patient payment"
        ADJUSTMENT = "Adjustment", "Adjustment"
        REVERSAL = "Reversal", "Reversal"

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="applications"
    )
    claim = models.ForeignKey(
        Claim, on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_applications"
    )
    visit = models.ForeignKey(
        "visits.Visit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_applications",
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_applications",
    )
    applied_date = models.DateField(auto_now_add=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    application_type = models.CharField(max_length=30, choices=ApplicationType.choices)
    adjustment_code = models.CharField(
        max_length=20, blank=True, default="", help_text="CARC code"
    )
    notes = models.TextField(blank=True, default="")
    posted_by = models.CharField(max_length=255)
    reversed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-applied_date"]
        verbose_name = "Payment Application"
        verbose_name_plural = "Payment Applications"

    def __str__(self):
        target = self.claim or self.visit or self.patient or "unknown"
        return f"{self.payment.payment_id} -> {target}: ${self.amount}"


class ERAException(models.Model):
    """
    A line item from an 835 ERA that could not be automatically matched to a
    claim in the system.  Billing staff resolve these manually.
    """

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="era_exceptions"
    )

    # Data as it arrived on the ERA
    patient_name_on_era = models.CharField(max_length=255)
    claim_id_on_era = models.CharField(max_length=50)
    dos = models.DateField(verbose_name="Date of service on ERA")
    cpt_code = models.CharField(max_length=10, blank=True, default="")
    charged_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2)
    adjustment_group = models.CharField(max_length=10, blank=True, default="")
    adjustment_reason = models.CharField(max_length=500, blank=True, default="")
    remark_code = models.CharField(max_length=20, blank=True, default="")

    # Suggested match
    possible_match_claim = models.ForeignKey(
        Claim,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="era_exception_suggestions",
    )
    confidence_pct = models.IntegerField(default=0)

    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["resolved", "-paid_amount"]
        verbose_name = "ERA Exception"
        verbose_name_plural = "ERA Exceptions"

    def __str__(self):
        return (
            f"ERA exception: {self.patient_name_on_era} / {self.claim_id_on_era} "
            f"${self.paid_amount} (resolved={self.resolved})"
        )
