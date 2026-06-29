from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PracticeSetupViewSet,
    ProviderViewSet,
    BillingProviderViewSet,
    ReferringProviderViewSet,
    FacilityViewSet,
    PayerViewSet,
    CPTCodeViewSet,
    DiagnosisCodeViewSet,
    ChartAccountViewSet,
    ClaimDefaultsViewSet,
    UserAccessViewSet,
)

router = DefaultRouter()
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"billing-providers", BillingProviderViewSet, basename="billing-provider")
router.register(r"referring-providers", ReferringProviderViewSet, basename="referring-provider")
router.register(r"facilities", FacilityViewSet, basename="facility")
router.register(r"payers", PayerViewSet, basename="payer")
router.register(r"cpt-codes", CPTCodeViewSet, basename="cpt-code")
router.register(r"diagnosis-codes", DiagnosisCodeViewSet, basename="diagnosis-code")
router.register(r"chart-accounts", ChartAccountViewSet, basename="chart-account")
router.register(r"user-access", UserAccessViewSet, basename="user-access")

# Singleton endpoints — no pk in URL; actions mapped manually
practice_detail = PracticeSetupViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update"}
)
claim_defaults_detail = ClaimDefaultsViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update"}
)

urlpatterns = [
    path("practice/", practice_detail, name="practice-setup"),
    path("claim-defaults/", claim_defaults_detail, name="claim-defaults"),
    path("", include(router.urls)),
]
