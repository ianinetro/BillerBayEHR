from django.contrib import admin
from .models import Payment, PaymentApplication, ERAException


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("payment_id", "payment_date", "payer_name", "payment_method", "amount", "unapplied_amount", "status")
    list_filter = ("payment_method", "status")
    search_fields = ("payment_id", "payer_name", "check_eft_number")
    ordering = ("-payment_date",)


@admin.register(PaymentApplication)
class PaymentApplicationAdmin(admin.ModelAdmin):
    list_display = ("payment", "claim", "applied_amount", "adjustment_amount", "applied_at")
    search_fields = ("payment__payment_id", "claim__claim_id")
    ordering = ("-applied_at",)


@admin.register(ERAException)
class ERAExceptionAdmin(admin.ModelAdmin):
    list_display = ("payment", "claim_id_raw", "reason", "amount", "resolved", "created_at")
    list_filter = ("resolved",)
    search_fields = ("payment__payment_id", "claim_id_raw", "reason")
    ordering = ("-created_at",)
