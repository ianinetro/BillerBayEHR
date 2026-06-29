"""
URL routing for the patients app.

Routes:
  /api/patients/                         — PatientViewSet list/create
  /api/patients/{id}/                    — PatientViewSet retrieve/update/delete
  /api/patients/{patient_pk}/insurance/  — PatientInsuranceViewSet (nested)
  /api/patients/{patient_pk}/insurance/{id}/ — individual insurance record
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers

from .views import PatientViewSet, PatientInsuranceViewSet

# Top-level router
router = DefaultRouter()
router.register(r"", PatientViewSet, basename="patient")

# Nested router for insurance records scoped to a patient
# Requires djangorestframework-nested; fall back to a flat route if not installed.
try:
    patients_router = nested_routers.NestedDefaultRouter(router, r"", lookup="patient")
    patients_router.register(r"insurance", PatientInsuranceViewSet, basename="patient-insurance")
    nested_urls = patients_router.urls
except Exception:
    # Graceful fallback: expose insurance as a flat endpoint
    nested_urls = []

urlpatterns = [
    path("", include(router.urls)),
    path("", include(nested_urls)),
]
