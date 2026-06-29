from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log endpoint.
    Supports search by actor, action, entity_id and filtering by action/result.
    """

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["actor", "action", "entity_id"]
    filterset_fields = ["action", "result"]
    ordering_fields = ["timestamp", "actor", "action", "result"]
    ordering = ["-timestamp"]
