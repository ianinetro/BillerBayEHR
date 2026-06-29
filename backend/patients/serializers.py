"""
Serializers for the patients app.

PatientInsuranceSerializer is nested inside PatientSerializer so a single
API call returns the full patient record including all insurance coverage.
Insurance records can also be managed independently via their own endpoint.
"""

from rest_framework import serializers
from .models import Patient, PatientInsurance


class PatientInsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientInsurance
        fields = [
            "id",
            "patient",
            "insurance_type",
            "payer_name",
            "payer_id",
            "subscriber_id",
            "group_number",
            "plan_name",
            "relationship",
            "copay",
            "deductible_remaining",
            "coinsurance",
            "release_of_info",
            "signature_on_file",
            "effective_start",
            "effective_stop",
            "authorization_number",
            "visits_authorized",
            "visits_used",
        ]


class PatientSerializer(serializers.ModelSerializer):
    """
    Full patient record including nested insurance coverage.
    Insurance records are read-only via this serializer; use the
    /api/patients/{id}/insurance/ sub-resource to mutate them.
    """

    insurance_records = PatientInsuranceSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "patient_id",
            "account_number",
            "name",
            "dob",
            "sex",
            "status",
            "primary_insurance",
            "secondary_insurance",
            "balance",
            "last_visit_date",
            "insurance_records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["patient_id", "created_at", "updated_at"]


class PatientListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views — omits nested insurance detail
    to keep response payloads small when paginating large patient panels.
    """

    class Meta:
        model = Patient
        fields = [
            "id",
            "patient_id",
            "account_number",
            "name",
            "dob",
            "sex",
            "status",
            "primary_insurance",
            "secondary_insurance",
            "balance",
            "last_visit_date",
            "updated_at",
        ]
