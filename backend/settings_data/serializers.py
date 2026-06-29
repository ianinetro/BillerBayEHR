from rest_framework import serializers
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


class PracticeSetupSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeSetup
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class BillingProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingProvider
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ReferringProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferringProvider
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class PayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payer
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class CPTCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPTCode
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class DiagnosisCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosisCode
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ChartAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartAccount
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class ClaimDefaultsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimDefaults
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class UserAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccess
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
