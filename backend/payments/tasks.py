from celery import shared_task


@shared_task(bind=True, max_retries=3)
def process_era_file(self, payment_id: int, file_content: str) -> None:
    """Parse an 835 ERA file and create ERAException records at service-line grain."""
    try:
        from decimal import Decimal

        from django.utils import timezone

        from edi.parsers.x12_835_parser import parse_835
        from payments.models import ERAException, Payment

        payment = Payment.objects.get(pk=payment_id)
        payment.status = Payment.Status.DRAFT
        payment.save(update_fields=["status"])

        parsed = parse_835(file_content)

        if parsed["payer_name"]:
            payment.payer_name = parsed["payer_name"]
        if parsed["check_number"]:
            payment.check_auth_number = parsed["check_number"]
        if parsed["payment_amount"]:
            payment.amount = Decimal(str(parsed["payment_amount"]))
            payment.unapplied = payment.amount
        if parsed["payment_date"]:
            try:
                from datetime import date
                pd = parsed["payment_date"]
                payment.payment_date = date(int(pd[:4]), int(pd[4:6]), int(pd[6:8]))
            except (ValueError, IndexError):
                pass

        payment.save(update_fields=["payer_name", "check_auth_number", "amount", "unapplied", "payment_date"])

        for row in parsed["claims"]:
            dos_value = timezone.now().date()
            raw_dos = row.get("dos", "")
            if raw_dos and len(raw_dos) >= 8:
                try:
                    from datetime import date as _date
                    dos_value = _date(int(raw_dos[:4]), int(raw_dos[4:6]), int(raw_dos[6:8]))
                except ValueError:
                    pass

            ERAException.objects.get_or_create(
                payment=payment,
                claim_id_on_era=row["claim_id"],
                cpt_code=row.get("cpt_code", ""),
                adjustment_group=row.get("adjustment_group", ""),
                adjustment_reason=row.get("adjustment_reason", ""),
                defaults={
                    "patient_name_on_era": row.get("patient_name", ""),
                    "dos": dos_value,
                    "charged_amount": Decimal(str(row.get("charged_amount", 0))),
                    "paid_amount": Decimal(str(row.get("paid", 0))),
                    "remark_code": row.get("remark_code", ""),
                    "confidence_pct": 0,
                    "resolved": False,
                },
            )

        payment.status = Payment.Status.UNMATCHED
        payment.source = Payment.Source.ERA
        payment.save(update_fields=["status", "source"])

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
