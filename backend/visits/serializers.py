"""
Serializers for the visits app.

VisitSerializer nests DiagnosisLine and ServiceLine so a single retrieve
call returns the complete encounter record ready for the billing UI to render.
VisitBillingInfoSerializer is also nested when present.

List views use VisitListSerializer (no nested arrays) for performance.
"""

from rest_framework import serializers
from .models import Visit, VisitBillingInfo, DiagnosisLine, ServiceLine


class DiagnosisLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosisLine
        fields = ["id", "visit", "pointer", "icd_code", "description"]


class ServiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceLine
        fields = [
            "id",
            "visit",
            "from_dos",
            "to_dos",
            "pos",
            "cpt_code",
            "modifiers",
            "diagnosis_pointers",
            "charge",
            "units",
            "balance",
        ]


class VisitBillingInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitBillingInfo
        fields = [
            "id",
            "visit",
            "referring_physician",
            "supervising_physician",
            "ordering_physician",
            "billing_provider",
            "billing_provider_npi",
            "rendering_provider",
            "employment_related",
            "auto_accident",
            "other_accident",
            "onset_date",
            "prior_authorization_number",
            "clia",
            "print_billing_statement",
        ]


class VisitSerializer(serializers.ModelSerializer):
    """
    Full visit record with nested clinical and billing sub-records.
    Nested arrays are read-only here; mutate them through their own endpoints.
    """

    diagnosis_lines = DiagnosisLineSerializer(many=True, read_only=True)
    service_lines = ServiceLineSerializer(many=True, read_only=True)
    billing_info = VisitBillingInfoSerializer(read_only=True)

    # Flatten patient name for convenience
    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = Visit
        fields = [
            "id",
            "visit_id",
            "patient",
            "patient_name",
            "date_of_service",
            "visit_type",
            "reason",
            "provider",
            "facility",
            "status",
            "charges",
            "balance",
            "linked_claim",
            "chief_complaint",
            "allergies",
            "blood_pressure",
            "weight",
            "provider_notes",
            "medication_summary",
            "visit_notes",
            "diagnosis_lines",
            "service_lines",
            "billing_info",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class VisitListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for paginated list views.
    Omits clinical text and nested arrays.
    """

    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = Visit
        fields = [
            "id",
            "visit_id",
            "patient",
            "patient_name",
            "date_of_service",
            "visit_type",
            "provider",
            "facility",
            "status",
            "charges",
            "balance",
            "linked_claim",
            "updated_at",
        ]
