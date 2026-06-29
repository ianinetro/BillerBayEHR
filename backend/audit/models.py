"""
Audit models for ClinicTraq.
Immutable activity log for HIPAA-aligned change tracking.
"""

from django.db import models


class AuditLog(models.Model):
    """
    Append-only record of a user action on any resource.
    Never update or delete rows in this table.
    """

    class Action(models.TextChoices):
        CLAIM_VALIDATION = "Claim validation", "Claim validation"
        CLAIM_SUBMISSION = "Claim submission", "Claim submission"
        ERA_AUTO_POST = "ERA auto-post", "ERA auto-post"
        PAYMENT_POSTING = "Payment posting", "Payment posting"
        SETTINGS_CHANGE = "Settings change", "Settings change"
        PATIENT_UPDATE = "Patient update", "Patient update"
        SSN_REVEAL = "SSN reveal", "SSN reveal"
        EXPORT = "Export", "Export"
        LOGIN = "Login", "Login"
        LOGOUT = "Logout", "Logout"

    class Result(models.TextChoices):
        COMPLETED = "Completed", "Completed"
        WARNING = "Warning", "Warning"
        FAILED = "Failed", "Failed"

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.CharField(max_length=150, db_index=True)
    role = models.CharField(max_length=50, blank=True)
    action = models.CharField(max_length=30, choices=Action.choices, db_index=True)
    entity_type = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    before_value = models.TextField(blank=True)
    after_value = models.TextField(blank=True)
    result = models.CharField(
        max_length=15, choices=Result.choices, default=Result.COMPLETED, db_index=True
    )
    ip_address = models.CharField(max_length=45, blank=True)
    device = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.actor} — {self.action} {self.entity_type}/{self.entity_id}"
