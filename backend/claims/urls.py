from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClaimViewSet

router = DefaultRouter()
router.register(r"", ClaimViewSet, basename="claim")

# Custom action routes are auto-registered by the router via @action decorators:
#   POST /claims/{id}/validate/  -> ClaimViewSet.validate_claim
#   POST /claims/{id}/submit/    -> ClaimViewSet.submit_claim

urlpatterns = [path("", include(router.urls))]
