from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, PatientInsuranceViewSet

router = DefaultRouter()
router.register(r"", PatientViewSet, basename="patient")

insurance_router = DefaultRouter()
insurance_router.register(r"", PatientInsuranceViewSet, basename="patient-insurance")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:patient_pk>/insurance/", include(insurance_router.urls)),
]
