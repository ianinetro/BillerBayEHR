from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import FeeSchedule, FeeScheduleLine, WorkQueueItem
from .serializers import FeeScheduleSerializer, FeeScheduleLineSerializer, WorkQueueItemSerializer


class FeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = FeeSchedule.objects.prefetch_related("lines").all()
    serializer_class = FeeScheduleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "payer_name"]
    ordering = ["name"]


class FeeScheduleLineViewSet(viewsets.ModelViewSet):
    queryset = FeeScheduleLine.objects.select_related("fee_schedule").all()
    serializer_class = FeeScheduleLineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["cpt_code", "description"]
    filterset_fields = ["fee_schedule", "cpt_code"]


class WorkQueueItemViewSet(viewsets.ModelViewSet):
    queryset = WorkQueueItem.objects.all()
    serializer_class = WorkQueueItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient_name", "claim_id", "visit_id", "payer", "provider", "reason"]
    filterset_fields = ["item_type", "resolved", "assigned_to", "priority"]
    ordering_fields = ["created_at", "updated_at", "age_days", "amount", "priority"]
    ordering = ["resolved", "-created_at"]
