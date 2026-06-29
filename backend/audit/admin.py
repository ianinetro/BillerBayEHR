from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "model_name", "object_id", "ip_address")
    list_filter = ("action", "model_name")
    search_fields = ("user__username", "model_name", "object_id", "ip_address")
    ordering = ("-timestamp",)
    readonly_fields = ("timestamp", "user", "action", "model_name", "object_id", "ip_address", "changes")
