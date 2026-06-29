from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "timestamp",
            "actor",
            "role",
            "action",
            "entity_type",
            "entity_id",
            "before_value",
            "after_value",
            "result",
            "ip_address",
            "device",
            "notes",
        ]
        read_only_fields = fields
