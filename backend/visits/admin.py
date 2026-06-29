from django.contrib import admin
from .models import Visit, DiagnosisLine, ServiceLine, VisitBillingInfo


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("visit_id", "patient", "date_of_service", "provider", "status", "charges", "balance")
    list_filter = ("status",)
    search_fields = ("visit_id", "patient__name", "patient__patient_id", "provider")
    ordering = ("-date_of_service",)


@admin.register(DiagnosisLine)
class DiagnosisLineAdmin(admin.ModelAdmin):
    list_display = ("visit", "pointer", "icd10_code", "description")
    search_fields = ("visit__visit_id", "icd10_code", "description")
    ordering = ("visit", "pointer")


@admin.register(ServiceLine)
class ServiceLineAdmin(admin.ModelAdmin):
    list_display = ("visit", "line_number", "cpt_code", "units", "charge_amount")
    search_fields = ("visit__visit_id", "cpt_code")
    ordering = ("visit", "line_number")


@admin.register(VisitBillingInfo)
class VisitBillingInfoAdmin(admin.ModelAdmin):
    list_display = ("visit", "place_of_service", "billing_provider", "referring_provider")
    search_fields = ("visit__visit_id",)
