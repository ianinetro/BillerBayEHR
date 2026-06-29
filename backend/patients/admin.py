from django.contrib import admin
from .models import Patient, PatientInsurance


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("patient_id", "name", "dob", "sex", "status", "primary_insurance", "balance")
    list_filter = ("status", "sex")
    search_fields = ("patient_id", "name", "account_number", "primary_insurance")
    ordering = ("name",)


@admin.register(PatientInsurance)
class PatientInsuranceAdmin(admin.ModelAdmin):
    list_display = ("patient", "payer_name", "priority", "member_id", "group_number")
    list_filter = ("priority",)
    search_fields = ("patient__name", "patient__patient_id", "payer_name", "member_id")
    ordering = ("patient", "priority")
