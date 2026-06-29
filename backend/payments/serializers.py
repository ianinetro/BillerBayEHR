from rest_framework import serializers
from .models import Payment, PaymentApplication, ERAException


class PaymentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentApplication
        fields = "__all__"
        read_only_fields = ["applied_date"]


class ERAExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ERAException
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    applications = PaymentApplicationSerializer(many=True, read_only=True)
    era_exceptions = ERAExceptionSerializer(many=True, read_only=True)

    # Frontend-friendly aliases
    payer = serializers.CharField(source="payer_name", required=False)
    check_number = serializers.CharField(source="check_auth_number", required=False, allow_blank=True)
    where_applied = serializers.SerializerMethodField()
    source = serializers.CharField(required=False)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["payment_id", "created_at", "updated_at"]

    def get_where_applied(self, obj):
        apps = obj.applications.filter(reversed=False)
        if not apps.exists():
            return None
        claim_ids = [a.claim.claim_id for a in apps if a.claim_id]
        return ", ".join(claim_ids) if claim_ids else "Applied"
