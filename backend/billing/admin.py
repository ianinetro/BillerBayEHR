from django.contrib import admin
from .models import WorkQueueItem


@admin.register(WorkQueueItem)
class WorkQueueItemAdmin(admin.ModelAdmin):
    list_display = ("id", "queue_type", "priority", "status", "patient", "claim", "assigned_to", "due_date", "created_at")
    list_filter = ("queue_type", "priority", "status")
    search_fields = ("patient__name", "patient__patient_id", "claim__claim_id", "assigned_to")
    ordering = ("-priority", "due_date")
