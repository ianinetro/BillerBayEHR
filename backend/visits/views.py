"""
Views for the visits app.

VisitViewSet is the primary endpoint. It switches between the lightweight
list serializer and the full nested serializer automatically.

Sub-resource viewsets (DiagnosisLineViewSet, ServiceLineViewSet,
VisitBillingInfoViewSet) allow the billing UI to update individual
components of a visit without re-posting the entire record.
"""

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import Visit, VisitBillingInfo, DiagnosisLine, ServiceLine
from .serializers import (
    VisitSerializer,
    VisitListSerializer,
    VisitBillingInfoSerializer,
    DiagnosisLineSerializer,
    ServiceLineSerializer,
)


class VisitViewSet(viewsets.ModelViewSet):
    """
    CRUD operations on Visit records.

    list   GET  /api/visits/           — paginated, lightweight
    create POST /api/visits/
    read   GET  /api/visits/{id}/      — full record with nested lines
    update PUT  /api/visits/{id}/
    patch  PATCH /api/visits/{id}/
    delete DELETE /api/visits/{id}/

    Filtering:
      ?status=Draft
      ?status=Ready+for+billing
      ?facility=Main+Clinic

    Search (partial, case-insensitive):
      ?search=johnson
      ?search=V-00042
      ?search=Dr.+Smith

    Ordering:
      ?ordering=-date_of_service
      ?ordering=patient__name
    """

    queryset = (
        Visit.objects.select_related("patient")
        .prefetch_related("diagnosis_lines", "service_lines", "billing_info")
        .all()
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["visit_id", "patient__name", "provider"]
    filterset_fields = ["status", "facility"]
    ordering_fields = [
        "date_of_service",
        "patient__name",
        "provider",
        "status",
        "charges",
        "balance",
        "updated_at",
    ]
    ordering = ["-date_of_service"]

    def get_serializer_class(self):
        if self.action == "list":
            return VisitListSerializer
        return VisitSerializer


class VisitBillingInfoViewSet(viewsets.ModelViewSet):
    """
    CMS-1500 billing metadata for a visit.
    Typically one-to-one, but exposed as a viewset for uniform CRUD.
    """

    serializer_class = VisitBillingInfoSerializer
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        visit_pk = self.kwargs.get("visit_pk")
        if visit_pk:
            return VisitBillingInfo.objects.filter(visit_id=visit_pk)
        return VisitBillingInfo.objects.all()


class DiagnosisLineViewSet(viewsets.ModelViewSet):
    """
    Diagnosis code lines scoped to a visit.
    Supports up to 12 pointers (A–L) per CMS-1500 box 21.
    """

    serializer_class = DiagnosisLineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["icd_code", "description"]
    filterset_fields = ["pointer"]

    def get_queryset(self):
        visit_pk = self.kwargs.get("visit_pk")
        if visit_pk:
            return DiagnosisLine.objects.filter(visit_id=visit_pk)
        return DiagnosisLine.objects.all()


class ServiceLineViewSet(viewsets.ModelViewSet):
    """
    Procedure / service lines scoped to a visit (CMS-1500 box 24).
    """

    serializer_class = ServiceLineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["cpt_code", "modifiers"]
    filterset_fields = ["pos", "cpt_code"]

    def get_queryset(self):
        visit_pk = self.kwargs.get("visit_pk")
        if visit_pk:
            return ServiceLine.objects.filter(visit_id=visit_pk)
        return ServiceLine.objects.all()
