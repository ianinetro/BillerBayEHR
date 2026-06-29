"""
URL routing for the visits app.

Routes:
  /api/visits/                              — VisitViewSet list/create
  /api/visits/{id}/                         — VisitViewSet retrieve/update/delete
  /api/visits/{visit_pk}/billing-info/      — VisitBillingInfoViewSet
  /api/visits/{visit_pk}/diagnoses/         — DiagnosisLineViewSet
  /api/visits/{visit_pk}/service-lines/     — ServiceLineViewSet
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    VisitViewSet,
    VisitBillingInfoViewSet,
    DiagnosisLineViewSet,
    ServiceLineViewSet,
)

router = DefaultRouter()
router.register(r"", VisitViewSet, basename="visit")

# Attempt nested router; fall back gracefully if the package is absent
try:
    from rest_framework_nested import routers as nested_routers

    visits_router = nested_routers.NestedDefaultRouter(router, r"", lookup="visit")
    visits_router.register(r"billing-info", VisitBillingInfoViewSet, basename="visit-billing-info")
    visits_router.register(r"diagnoses", DiagnosisLineViewSet, basename="visit-diagnosis")
    visits_router.register(r"service-lines", ServiceLineViewSet, basename="visit-service-line")
    nested_urls = visits_router.urls
except Exception:
    nested_urls = []

urlpatterns = [
    path("", include(router.urls)),
    path("", include(nested_urls)),
]
