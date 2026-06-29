from django.contrib import admin
from .models import (
    PracticeSetup,
    Provider,
    BillingProvider,
    ReferringProvider,
    Facility,
    Payer,
    CPTCode,
    DiagnosisCode,
    ChartAccount,
    ClaimDefaults,
    UserAccess,
)


@admin.register(PracticeSetup)
class PracticeSetupAdmin(admin.ModelAdmin):
    list_display = ("practice_name", "npi", "tax_id")


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "npi", "specialty", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "npi")


@admin.register(BillingProvider)
class BillingProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "npi", "tax_id", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "npi")


@admin.register(ReferringProvider)
class ReferringProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "npi", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "npi")


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "npi", "place_of_service_code", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "npi")


@admin.register(Payer)
class PayerAdmin(admin.ModelAdmin):
    list_display = ("name", "payer_id", "claim_type", "is_active")
    list_filter = ("claim_type", "is_active")
    search_fields = ("name", "payer_id")


@admin.register(CPTCode)
class CPTCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "description", "default_fee", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "description")


@admin.register(DiagnosisCode)
class DiagnosisCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "description", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "description")


@admin.register(ChartAccount)
class ChartAccountAdmin(admin.ModelAdmin):
    list_display = ("account_number", "name", "account_type", "is_active")
    list_filter = ("account_type", "is_active")
    search_fields = ("account_number", "name")


@admin.register(ClaimDefaults)
class ClaimDefaultsAdmin(admin.ModelAdmin):
    list_display = ("id",)


@admin.register(UserAccess)
class UserAccessAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("user__username", "user__email")
