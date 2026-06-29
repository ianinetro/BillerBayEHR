from rest_framework import serializers
from .models import Claim, ClaimValidationIssue, ClaimSubmissionHistory


class ClaimValidationIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimValidationIssue
        fields = "__all__"
        read_only_fields = ["created_at"]


class ClaimSubmissionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimSubmissionHistory
        fields = "__all__"
        read_only_fields = ["submitted_at"]


class ClaimSerializer(serializers.ModelSerializer):
    validation_issues = ClaimValidationIssueSerializer(many=True, read_only=True)
    submission_history = ClaimSubmissionHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Claim
        fields = "__all__"
        read_only_fields = ["claim_id", "created_at", "updated_at"]
