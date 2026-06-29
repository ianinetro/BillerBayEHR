from django.contrib import admin
from .models import Claim, ClaimValidationIssue, ClaimSubmissionHistory


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("claim_id", "patient", "date_of_service", "status", "claim_type", "billed_amount", "paid_amount")
    list_filter = ("status", "claim_type", "validation_status", "submission_status")
    search_fields = ("claim_id", "patient__name", "patient__patient_id")
    ordering = ("-created_at",)


@admin.register(ClaimValidationIssue)
class ClaimValidationIssueAdmin(admin.ModelAdmin):
    list_display = ("claim", "severity", "field_name", "message")
    list_filter = ("severity",)
    search_fields = ("claim__claim_id", "field_name", "message")
    ordering = ("claim", "severity")


@admin.register(ClaimSubmissionHistory)
class ClaimSubmissionHistoryAdmin(admin.ModelAdmin):
    list_display = ("claim", "submitted_at", "status", "payer_control_number")
    list_filter = ("status",)
    search_fields = ("claim__claim_id", "payer_control_number")
    ordering = ("-submitted_at",)
