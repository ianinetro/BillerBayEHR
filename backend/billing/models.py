"""
Billing models for ClinicTraq.
Fee schedules, billing rules, batch operation records, and the billing work queue.
"""

from django.db import models


class FeeSchedule(models.Model):
    """
    Negotiated or standard fee schedule for a payer.
    """

    name = models.CharField(max_length=255, unique=True)
    payer_name = models.CharField(max_length=255, blank=True)
    effective_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Fee Schedule"
        verbose_name_plural = "Fee Schedules"

    def __str__(self):
        return self.name


class FeeScheduleLine(models.Model):
    """
    Individual CPT/HCPCS rate within a fee schedule.
    """

    fee_schedule = models.ForeignKey(
        FeeSchedule, on_delete=models.CASCADE, related_name="lines"
    )
    cpt_code = models.CharField(max_length=10)
    description = models.CharField(max_length=255, blank=True)
    allowed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    modifiers = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["cpt_code"]
        unique_together = [("fee_schedule", "cpt_code", "modifiers")]
        verbose_name = "Fee Schedule Line"
        verbose_name_plural = "Fee Schedule Lines"

    def __str__(self):
        return f"{self.fee_schedule.name} — {self.cpt_code}: ${self.allowed_amount}"


class WorkQueueItem(models.Model):
    """
    A single actionable item in the billing work queue.

    Each item represents something a biller needs to resolve — a failed
    validation, an unmatched ERA line, a rejected claim, A/R follow-up, etc.
    """

    class ItemType(models.TextChoices):
        VALIDATION_FAILED = "Validation failed", "Validation failed"
        ERA_UNMATCHED = "ERA unmatched", "ERA unmatched"
        REJECTED_CLAIM = "Rejected claim", "Rejected claim"
        AR_FOLLOWUP = "A/R follow-up", "A/R follow-up"
        SECONDARY_PENDING = "Secondary pending", "Secondary pending"
        MISSING_BILLING_DATA = "Missing billing data", "Missing billing data"
        READY_TO_SUBMIT = "Ready to submit", "Ready to submit"
        AWAITING_BATCH = "Awaiting batch", "Awaiting batch"
        DENIED = "Denied", "Denied"
        PATIENT_BALANCE = "Patient balance", "Patient balance"
        STALE_CLAIM = "Stale claim", "Stale claim"

    class Priority(models.TextChoices):
        HIGH = "High", "High"
        MED = "Med", "Med"
        LOW = "Low", "Low"

    # Classification
    item_type = models.CharField(max_length=30, choices=ItemType.choices)
    priority = models.CharField(max_length=5, choices=Priority.choices, default=Priority.MED)

    # Denormalized display fields (for fast list rendering without joins)
    patient_name = models.CharField(max_length=255)
    visit_id = models.CharField(max_length=20, blank=True, default="")
    claim_id = models.CharField(max_length=20, blank=True, default="")
    payer = models.CharField(max_length=255, blank=True, default="")
    provider = models.CharField(max_length=255, blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Work detail
    reason = models.TextField(blank=True, default="")
    assigned_to = models.CharField(max_length=255, blank=True, default="")
    age_days = models.IntegerField(default=0)
    next_action = models.CharField(max_length=500, blank=True, default="")

    # Resolution
    resolved = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "resolved",
            models.Case(
                models.When(priority="High", then=0),
                models.When(priority="Med", then=1),
                models.When(priority="Low", then=2),
                default=3,
                output_field=models.IntegerField(),
            ),
            "-created_at",
        ]
        verbose_name = "Work Queue Item"
        verbose_name_plural = "Work Queue Items"

    def __str__(self):
        return f"[{self.priority}] {self.item_type} — {self.patient_name} ({self.claim_id})"
