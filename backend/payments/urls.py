from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter()
router.register(r"", PaymentViewSet, basename="payment")

# Custom action routes registered via @action decorators:
#   POST /payments/{id}/auto-post-era/    -> PaymentViewSet.auto_post_era
#   POST /payments/{id}/match-exception/  -> PaymentViewSet.match_exception

urlpatterns = [path("", include(router.urls))]
