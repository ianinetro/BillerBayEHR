from rest_framework import serializers
from .models import FeeSchedule, FeeScheduleLine, WorkQueueItem


class FeeScheduleLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeScheduleLine
        fields = "__all__"


class FeeScheduleSerializer(serializers.ModelSerializer):
    lines = FeeScheduleLineSerializer(many=True, read_only=True)

    class Meta:
        model = FeeSchedule
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class WorkQueueItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkQueueItem
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
