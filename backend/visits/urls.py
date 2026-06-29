from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitViewSet, VisitBillingInfoViewSet, DiagnosisLineViewSet, ServiceLineViewSet

router = DefaultRouter()
router.register(r"", VisitViewSet, basename="visit")

billing_router = DefaultRouter()
billing_router.register(r"", VisitBillingInfoViewSet, basename="visit-billing-info")

diagnosis_router = DefaultRouter()
diagnosis_router.register(r"", DiagnosisLineViewSet, basename="visit-diagnosis")

service_router = DefaultRouter()
service_router.register(r"", ServiceLineViewSet, basename="visit-service-line")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:visit_pk>/billing-info/", include(billing_router.urls)),
    path("<int:visit_pk>/diagnoses/", include(diagnosis_router.urls)),
    path("<int:visit_pk>/service-lines/", include(service_router.urls)),
]
