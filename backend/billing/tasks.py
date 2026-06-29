from celery import shared_task


@shared_task
def refresh_work_queue():
    """Periodic task: sync WorkQueueItems from claim/visit states."""
    from billing.models import WorkQueueItem
    from claims.models import Claim
    from django.utils import timezone

    today = timezone.now().date()

    for claim in Claim.objects.filter(status="Rejected").select_related("patient"):
        age = (today - claim.date_of_service).days if claim.date_of_service else 0
        WorkQueueItem.objects.update_or_create(
            claim_id=claim.claim_id,
            item_type="Rejected claim",
            defaults={
                "patient_name": claim.patient.name if claim.patient_id else "",
                "payer": claim.payer or "",
                "amount": claim.balance,
                "reason": claim.last_response or "Claim rejected",
                "priority": "High",
                "resolved": False,
                "age_days": age,
            },
        )
