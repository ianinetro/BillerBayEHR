"""
Views for the patients app.

PatientViewSet returns the lightweight list serializer for collection
endpoints and the full nested serializer for retrieve/create/update so
the insurance records come along on a detail fetch without extra round trips.

PatientInsuranceViewSet allows standalone CRUD on insurance records, e.g.
for the insurance tab in the patient chart UI.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Patient, PatientInsurance
from .serializers import (
    PatientSerializer,
    PatientListSerializer,
    PatientInsuranceSerializer,
)


class PatientViewSet(viewsets.ModelViewSet):
    """
    CRUD operations on Patient records.

    list   GET  /api/patients/             — paginated, lightweight
    create POST /api/patients/             — full record
    read   GET  /api/patients/{id}/        — full record with insurance
    update PUT  /api/patients/{id}/
    patch  PATCH /api/patients/{id}/
    delete DELETE /api/patients/{id}/

    Filtering:
      ?status=Active
      ?primary_insurance=Medicare

    Search (partial, case-insensitive):
      ?search=johnson
      ?search=P10042
      ?search=ACC-9901
    """

    queryset = Patient.objects.all().order_by("name")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "patient_id", "account_number"]
    filterset_fields = ["status", "primary_insurance"]
    ordering_fields = ["name", "patient_id", "balance", "last_visit_date", "updated_at"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer


class PatientInsuranceViewSet(viewsets.ModelViewSet):
    """
    Standalone CRUD for PatientInsurance records.

    Scoped to a single patient via the nested router:
      /api/patients/{patient_pk}/insurance/
    """

    serializer_class = PatientInsuranceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["insurance_type"]

    def get_queryset(self):
        patient_pk = self.kwargs.get("patient_pk")
        if patient_pk:
            return PatientInsurance.objects.filter(patient_id=patient_pk)
        return PatientInsurance.objects.all()
