from celery import shared_task


@shared_task(bind=True, max_retries=3)
def batch_submit_claims(self, claim_ids):
    """Submit a batch of claims and update their statuses."""
    try:
        from claims.models import Claim, ClaimSubmissionHistory
        from django.utils import timezone

        claims = Claim.objects.filter(pk__in=claim_ids, status="Ready to submit")
        for claim in claims:
            claim.status = "Submitted"
            claim.submission_status = "Pending"
            claim.save(update_fields=["status", "submission_status"])
            ClaimSubmissionHistory.objects.create(
                claim=claim,
                submitted_at=timezone.now(),
                method="Batch",
                status="Submitted",
            )
        return {"submitted": claims.count()}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
