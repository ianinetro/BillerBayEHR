from celery import shared_task


@shared_task(bind=True, max_retries=3)
def process_era_file(self, payment_id, file_content):
    """Parse an 835 ERA file and create ERAException records for each claim line."""
    try:
        from payments.models import Payment, ERAException
        from edi.parsers.x12_835_parser import parse_835
        from django.utils import timezone
        from decimal import Decimal

        payment = Payment.objects.get(pk=payment_id)
        payment.status = "Draft"
        payment.save(update_fields=["status"])

        parsed = parse_835(file_content)

        if parsed["payer_name"]:
            payment.payer_name = parsed["payer_name"]
        if parsed["check_number"]:
            payment.check_auth_number = parsed["check_number"]
        if parsed["payment_amount"]:
            payment.amount = Decimal(str(parsed["payment_amount"]))
            payment.unapplied = payment.amount

        payment.save(update_fields=["payer_name", "check_auth_number", "amount", "unapplied"])

        for claim_data in parsed["claims"]:
            ERAException.objects.get_or_create(
                payment=payment,
                claim_id_on_era=claim_data["claim_id"],
                defaults={
                    "patient_name_on_era": claim_data["patient_name"],
                    "dos": claim_data.get("dos") or timezone.now().date(),
                    "cpt_code": "",
                    "paid_amount": Decimal(str(claim_data["paid"])),
                    "adjustment_reason": ", ".join(
                        f"{a['group']}-{a['reason']}" for a in claim_data.get("adjustments", [])
                    ),
                    "confidence_pct": 0,
                    "resolved": False,
                },
            )

        payment.status = Payment.Status.UNMATCHED
        payment.source = Payment.Source.ERA
        payment.save(update_fields=["status", "source"])

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
