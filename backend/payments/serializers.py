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

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["payment_id", "created_at", "updated_at"]
