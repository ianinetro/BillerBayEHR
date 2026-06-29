from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeScheduleViewSet, FeeScheduleLineViewSet, WorkQueueItemViewSet

router = DefaultRouter()
router.register(r"fee-schedules", FeeScheduleViewSet, basename="fee-schedule")
router.register(r"fee-schedule-lines", FeeScheduleLineViewSet, basename="fee-schedule-line")
router.register(r"work-queue", WorkQueueItemViewSet, basename="work-queue-item")

urlpatterns = [path("", include(router.urls))]
