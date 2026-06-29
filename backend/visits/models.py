"""
Visit models for ClinicTraq.

A Visit represents a single clinical encounter. Attached to it are:
  - VisitBillingInfo     — CMS-1500 box-level billing metadata (one-to-one)
  - DiagnosisLine        — ICD-10 diagnosis codes (pointers A–L per CMS-1500 box 21)
  - ServiceLine          — CPT procedure lines (CMS-1500 box 24)

Visit ID format: V-XXXXX  (prefix V- + 5-digit zero-padded number)
"""

from django.db import models
from patients.models import Patient


class Visit(models.Model):
    """
    Core clinical visit record.
    """

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        READY_FOR_BILLING = "Ready for billing", "Ready for billing"
        MISSING_INSURANCE = "Missing insurance", "Missing insurance"
        MISSING_DIAGNOSIS = "Missing diagnosis", "Missing diagnosis"
        PRIMARY_CLAIM_SUBMITTED = "Primary claim submitted", "Primary claim submitted"
        BILLED = "Billed", "Billed"

    # Identifiers
    visit_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Human-readable visit identifier, e.g. V-00042",
    )

    # Relationship
    patient = models.ForeignKey(
        Patient, on_delete=models.PROTECT, related_name="visits", db_index=True
    )

    # Core visit data
    date_of_service = models.DateField(db_index=True)
    visit_type = models.CharField(
        max_length=100, blank=True, help_text="E.g. Office visit, Telehealth, Procedure"
    )
    reason = models.CharField(max_length=255, blank=True, help_text="Reason for visit / chief complaint")
    provider = models.CharField(max_length=255, db_index=True)
    facility = models.CharField(max_length=255, blank=True, db_index=True)

    # Workflow status
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    # Financial summary
    charges = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Total charges for this visit"
    )
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Outstanding balance on this visit"
    )

    # Claim linkage
    linked_claim = models.CharField(
        max_length=50, blank=True, help_text="Claim number once a claim has been generated"
    )

    # Clinical notes & vitals
    chief_complaint = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    blood_pressure = models.CharField(max_length=20, blank=True, help_text="E.g. 120/80")
    weight = models.CharField(max_length=20, blank=True, help_text="Weight with unit, e.g. 165 lbs")
    provider_notes = models.TextField(blank=True)
    medication_summary = models.TextField(blank=True)
    visit_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_of_service"]
        verbose_name = "Visit"
        verbose_name_plural = "Visits"

    def __str__(self):
        return f"{self.visit_id} — {self.patient.name} ({self.date_of_service})"


class VisitBillingInfo(models.Model):
    """
    CMS-1500 billing metadata attached to a visit (one-to-one).
    Captures referring/supervising/ordering/rendering providers, accident
    flags, authorization numbers, and other box-level form data.
    """

    visit = models.OneToOneField(
        Visit, on_delete=models.CASCADE, related_name="billing_info"
    )

    # Provider references (names or NPI strings)
    referring_physician = models.CharField(max_length=255, blank=True)
    supervising_physician = models.CharField(max_length=255, blank=True)
    ordering_physician = models.CharField(max_length=255, blank=True)
    billing_provider = models.CharField(max_length=255, blank=True)
    billing_provider_npi = models.CharField(max_length=20, blank=True)
    rendering_provider = models.CharField(max_length=255, blank=True)

    # CMS-1500 box 10 — accident flags
    employment_related = models.BooleanField(default=False)
    auto_accident = models.BooleanField(default=False)
    other_accident = models.BooleanField(default=False)

    # Authorization & clinical info
    onset_date = models.DateField(
        null=True, blank=True, help_text="Date of first symptom or illness onset"
    )
    prior_authorization_number = models.CharField(max_length=100, blank=True)
    clia = models.CharField(
        max_length=20, blank=True, help_text="CLIA number for laboratory services"
    )

    # Billing preferences
    print_billing_statement = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Visit Billing Info"
        verbose_name_plural = "Visit Billing Info"

    def __str__(self):
        return f"Billing info for {self.visit.visit_id}"


class DiagnosisLine(models.Model):
    """
    A single ICD-10 diagnosis code attached to a visit.
    Pointer values A–L correspond to CMS-1500 box 21 slots.
    """

    POINTER_CHOICES = [(c, c) for c in "ABCDEFGHIJKL"]

    visit = models.ForeignKey(
        Visit, on_delete=models.CASCADE, related_name="diagnosis_lines"
    )
    pointer = models.CharField(
        max_length=1,
        choices=POINTER_CHOICES,
        help_text="CMS-1500 box 21 letter pointer (A–L)",
    )
    icd_code = models.CharField(max_length=20, help_text="ICD-10-CM code, e.g. M54.5")
    description = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["pointer"]
        unique_together = [("visit", "pointer")]
        verbose_name = "Diagnosis Line"
        verbose_name_plural = "Diagnosis Lines"

    def __str__(self):
        return f"{self.visit.visit_id} [{self.pointer}] {self.icd_code}"


class ServiceLine(models.Model):
    """
    A single procedure / service line on a visit (CMS-1500 box 24).
    Multiple lines may share the same CPT with different modifiers or dates.
    """

    visit = models.ForeignKey(
        Visit, on_delete=models.CASCADE, related_name="service_lines"
    )

    # Date range (box 24a)
    from_dos = models.DateField(verbose_name="From date of service")
    to_dos = models.DateField(
        verbose_name="To date of service", null=True, blank=True
    )

    # Place of service (box 24b) — 2-digit CMS code
    pos = models.CharField(
        max_length=5, verbose_name="Place of service", help_text="CMS POS code, e.g. 11"
    )

    # Procedure (box 24d)
    cpt_code = models.CharField(max_length=10, help_text="CPT or HCPCS code")
    modifiers = models.CharField(
        max_length=20,
        blank=True,
        help_text="Up to 4 modifiers separated by spaces, e.g. '25 GT'",
    )

    # Diagnosis pointer (box 24e) — letters from DiagnosisLine
    diagnosis_pointers = models.CharField(
        max_length=12,
        blank=True,
        help_text="Diagnosis pointer letters referencing DiagnosisLine, e.g. 'AB'",
    )

    # Financials (boxes 24f, 24g, balance)
    charge = models.DecimalField(max_digits=10, decimal_places=2)
    units = models.IntegerField(default=1)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["from_dos", "cpt_code"]
        verbose_name = "Service Line"
        verbose_name_plural = "Service Lines"

    def __str__(self):
        return f"{self.visit.visit_id} — {self.cpt_code} ({self.from_dos})"
