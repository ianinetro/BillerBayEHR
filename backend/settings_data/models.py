"""
Settings models for ClinicTraq.
Practice information, provider profiles, payer configuration, and access control.
"""

from django.db import models


class PracticeSetup(models.Model):
    """
    Singleton-style practice / billing entity configuration.
    """

    company_name = models.CharField(max_length=255)
    company_id = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    fax = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)
    zip = models.CharField(max_length=10, blank=True)
    statement_header = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Practice Setup"
        verbose_name_plural = "Practice Setup"

    def __str__(self):
        return self.company_name


class Provider(models.Model):
    """
    Individual rendering provider (physician, NP, PA, therapist, etc.).
    """

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    provider_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    npi = models.CharField(max_length=20, blank=True, db_index=True, verbose_name="NPI")
    taxonomy = models.CharField(max_length=20, blank=True)
    default_facility = models.CharField(max_length=100, blank=True)
    default_billing_provider = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Provider"
        verbose_name_plural = "Providers"

    def __str__(self):
        return f"{self.name} ({self.provider_id})"


class BillingProvider(models.Model):
    """
    Billing entity / group that appears on claims.
    """

    class OrganizationType(models.TextChoices):
        GROUP = "Group", "Group"
        INDIVIDUAL = "Individual", "Individual"
        HOSPITAL = "Hospital", "Hospital"
        OTHER = "Other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    name = models.CharField(max_length=255)
    print_on_claim = models.BooleanField(default=True)
    group_npi = models.CharField(max_length=20, blank=True, verbose_name="Group NPI")
    tax_id = models.CharField(max_length=20, blank=True)
    organization_type = models.CharField(
        max_length=20, choices=OrganizationType.choices, default=OrganizationType.GROUP
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Billing Provider"
        verbose_name_plural = "Billing Providers"

    def __str__(self):
        return self.name


class ReferringProvider(models.Model):
    """
    External referring / ordering provider.
    """

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    provider_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    npi = models.CharField(max_length=20, blank=True, db_index=True, verbose_name="NPI")
    specialty = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Referring Provider"
        verbose_name_plural = "Referring Providers"

    def __str__(self):
        return f"{self.name} ({self.provider_id})"


class Facility(models.Model):
    """
    Service facility / place of service location.
    """

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    facility_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    print_name = models.CharField(max_length=255, blank=True)
    npi = models.CharField(max_length=20, blank=True, verbose_name="NPI")
    address = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Facility"
        verbose_name_plural = "Facilities"

    def __str__(self):
        return f"{self.name} ({self.facility_id})"


class Payer(models.Model):
    """
    Insurance payer / carrier configuration.
    """

    class SubmissionMethod(models.TextChoices):
        CLEARINGHOUSE = "Clearinghouse", "Clearinghouse"
        DIRECT = "Direct", "Direct"
        PAPER = "Paper", "Paper"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    insurance_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255, db_index=True)
    payer_id = models.CharField(max_length=50, blank=True, db_index=True)
    eligibility_payer = models.CharField(max_length=100, blank=True)
    submission_method = models.CharField(
        max_length=20,
        choices=SubmissionMethod.choices,
        default=SubmissionMethod.CLEARINGHOUSE,
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    timely_filing_days = models.IntegerField(default=365)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Payer"
        verbose_name_plural = "Payers"

    def __str__(self):
        return f"{self.name} ({self.insurance_id})"


class CPTCode(models.Model):
    """
    Procedure code with default billing parameters.
    """

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    code = models.CharField(max_length=10, unique=True)
    description = models.CharField(max_length=500, blank=True)
    default_pos = models.CharField(max_length=10, blank=True, verbose_name="Default POS")
    default_modifiers = models.CharField(max_length=50, blank=True)
    default_charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    effective_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "CPT Code"
        verbose_name_plural = "CPT Codes"

    def __str__(self):
        return f"{self.code} — {self.description}"


class DiagnosisCode(models.Model):
    """
    ICD-10 / HCPCS diagnosis code reference.
    """

    class CodeType(models.TextChoices):
        ICD10 = "ICD-10", "ICD-10"
        HCPCS = "HCPCS", "HCPCS"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    code_type = models.CharField(max_length=10, choices=CodeType.choices, default=CodeType.ICD10)
    code = models.CharField(max_length=20, unique=True)
    description = models.CharField(max_length=500, blank=True)
    billable = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Diagnosis Code"
        verbose_name_plural = "Diagnosis Codes"

    def __str__(self):
        return f"{self.code} ({self.code_type})"


class ChartAccount(models.Model):
    """
    Chart of accounts entry for financial transaction mapping.
    """

    class TransactionType(models.TextChoices):
        CREDIT = "Credit", "Credit"
        DEBIT = "Debit", "Debit"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    account_id = models.CharField(max_length=50, unique=True)
    account_type = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=500, blank=True)
    transaction_type = models.CharField(
        max_length=10, choices=TransactionType.choices, default=TransactionType.Credit
    )
    default_mapping = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["account_id"]
        verbose_name = "Chart Account"
        verbose_name_plural = "Chart Accounts"

    def __str__(self):
        return f"{self.account_id} — {self.description}"


class ClaimDefaults(models.Model):
    """
    Practice-wide claim submission defaults. Treated as a singleton via PracticeSetup FK.
    """

    practice = models.OneToOneField(
        PracticeSetup, on_delete=models.CASCADE, related_name="claim_defaults"
    )
    default_facility = models.CharField(max_length=100, blank=True)
    default_billing_provider = models.CharField(max_length=100, blank=True)
    default_pos = models.CharField(max_length=10, blank=True, verbose_name="Default POS")
    auto_submit = models.BooleanField(default=False)
    claim_form_version = models.CharField(max_length=20, blank=True)
    statement_defaults = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Claim Defaults"
        verbose_name_plural = "Claim Defaults"

    def __str__(self):
        return f"Claim Defaults for {self.practice}"


class UserAccess(models.Model):
    """
    Application user access record with role-based permissions.
    """

    class Role(models.TextChoices):
        ADMIN = "Admin", "Admin"
        BILLING_TEAM = "Billing team member", "Billing team member"
        PAYMENT_POSTER = "Payment poster", "Payment poster"
        PROVIDER = "Provider", "Provider"
        READ_ONLY = "Read-only", "Read-only"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        INACTIVE = "Inactive", "Inactive"

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.READ_ONLY)
    office_access = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    mfa_enabled = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["username"]
        verbose_name = "User Access"
        verbose_name_plural = "User Access"

    def __str__(self):
        return f"{self.username} ({self.role})"
