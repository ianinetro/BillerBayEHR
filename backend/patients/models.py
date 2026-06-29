"""
Patient models for ClinicTraq.

Covers patient demographics and all associated insurance coverage records.
A patient may carry a primary and optional secondary insurance, each stored
as a PatientInsurance row with its own eligibility, authorization, and
cost-share details.

Patient ID format: P10042  (prefix P + 5-digit zero-padded number)
"""

from django.db import models


class Patient(models.Model):
    """
    Core patient demographic and account record.
    """

    class Sex(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "Other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"
        NEEDS_REVIEW = "Needs review", "Needs review"

    # Identifiers
    patient_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Human-readable patient identifier, e.g. P10042",
    )
    account_number = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Practice account number, may differ from patient_id",
    )

    # Demographics
    name = models.CharField(max_length=255, db_index=True)
    dob = models.DateField(verbose_name="Date of birth")
    sex = models.CharField(max_length=10, choices=Sex.choices, default=Sex.OTHER)

    # Account state
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )

    # Insurance summary (denormalized for list-view performance)
    primary_insurance = models.CharField(max_length=255, blank=True, db_index=True)
    secondary_insurance = models.CharField(max_length=255, blank=True)

    # Financial
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, help_text="Outstanding patient balance"
    )

    # Visit history
    last_visit_date = models.DateField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Patient"
        verbose_name_plural = "Patients"

    def save(self, *args, **kwargs):
        if not self.patient_id:
            last = Patient.objects.order_by("patient_id").last()
            if last:
                try:
                    seq = int(last.patient_id.lstrip("P")) + 1
                except (ValueError, AttributeError):
                    seq = 10001
            else:
                seq = 10001
            self.patient_id = f"P{seq:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"


class PatientInsurance(models.Model):
    """
    Insurance coverage record for a patient.
    A patient may have a primary and a secondary coverage record.
    """

    class InsuranceType(models.TextChoices):
        PRIMARY = "primary", "Primary"
        SECONDARY = "secondary", "Secondary"

    class Relationship(models.TextChoices):
        SELF = "Self", "Self"
        SPOUSE = "Spouse", "Spouse"
        CHILD = "Child", "Child"
        OTHER = "Other", "Other"

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="insurance_records"
    )

    # Coverage type
    insurance_type = models.CharField(
        max_length=10, choices=InsuranceType.choices, default=InsuranceType.PRIMARY
    )

    # Payer details
    payer_name = models.CharField(max_length=255)
    payer_id = models.CharField(max_length=50, blank=True, help_text="Electronic payer ID")
    subscriber_id = models.CharField(
        max_length=100, blank=True, help_text="Member / subscriber ID on card"
    )
    group_number = models.CharField(max_length=100, blank=True)
    plan_name = models.CharField(max_length=255, blank=True)

    # Subscriber relationship to patient
    relationship = models.CharField(
        max_length=10, choices=Relationship.choices, default=Relationship.SELF
    )

    # Cost share
    copay = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    deductible_remaining = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    coinsurance = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Patient coinsurance percentage (e.g. 20.00 for 20%)",
    )

    # Consent flags
    release_of_info = models.BooleanField(
        default=False, help_text="Patient signed release of information"
    )
    signature_on_file = models.BooleanField(
        default=False, help_text="Assignment of benefits signature on file"
    )

    # Coverage dates
    effective_start = models.DateField(null=True, blank=True)
    effective_stop = models.DateField(null=True, blank=True)

    # Authorization
    authorization_number = models.CharField(max_length=100, blank=True)
    visits_authorized = models.IntegerField(
        null=True, blank=True, help_text="Total visits authorized for this benefit period"
    )
    visits_used = models.IntegerField(
        null=True, blank=True, help_text="Visits already used against the authorization"
    )

    class Meta:
        ordering = ["insurance_type"]
        verbose_name = "Patient Insurance"
        verbose_name_plural = "Patient Insurance Records"
        unique_together = [("patient", "insurance_type")]

    def __str__(self):
        return f"{self.patient.patient_id} — {self.insurance_type} ({self.payer_name})"
