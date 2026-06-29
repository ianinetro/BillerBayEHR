"""
Load demo data matching the BillerBay interactive mockup.
Run: python manage.py seed
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, datetime


class Command(BaseCommand):
    help = "Seed the database with demo patients, visits, claims, payments, and work queue items"

    def handle(self, *args, **options):
        self._seed_settings()
        self._seed_patients()
        self._seed_visits()
        self._seed_claims()
        self._seed_payments()
        self._seed_billing()
        self.stdout.write(self.style.SUCCESS("Demo data loaded successfully."))

    def _seed_settings(self):
        from settings_data.models import PracticeSetup, Provider, Facility, Payer, BillingProvider
        PracticeSetup.objects.get_or_create(
            company_id="APEX-001",
            defaults=dict(company_name="Apex Family Care LLC", phone="(602) 555-1000",
                          fax="(602) 555-1001", address="920 Health Park Dr",
                          city="Phoenix", state="AZ", zip="85001",
                          statement_header="Apex Family Care Billing Department"),
        )
        Provider.objects.get_or_create(provider_id="PR-100", defaults=dict(
            name="Dr. Harlan", npi="1740283991", taxonomy="207Q00000X",
            default_facility="Apex Main", default_billing_provider="Apex Family Care LLC", status="Active"))
        Provider.objects.get_or_create(provider_id="PR-101", defaults=dict(
            name="Dr. Singh", npi="1659372827", taxonomy="207R00000X",
            default_facility="Apex North", default_billing_provider="Apex Family Care LLC", status="Active"))
        Facility.objects.get_or_create(facility_id="FAC-01", defaults=dict(
            name="Apex Main", print_name="Apex Main Clinic", npi="1982773220",
            address="920 Health Park Dr", status="Active"))
        Facility.objects.get_or_create(facility_id="FAC-02", defaults=dict(
            name="Apex North", print_name="Apex North Clinic", npi="1982773221",
            address="55 North Ave", status="Active"))
        BillingProvider.objects.get_or_create(name="Apex Family Care LLC", defaults=dict(
            print_on_claim=True, group_npi="1234567893", tax_id="XX-XXX2388",
            organization_type="Group", status="Active"))
        for ins_id, name, payer_id in [
            ("INS-01", "Medicare", "MEDICARE-AZ"),
            ("INS-02", "BCBS", "BCBS-AZ"),
            ("INS-03", "Aetna", "AETNA-AZ"),
            ("INS-04", "UnitedHealthcare", "UHC-AZ"),
            ("INS-05", "Humana", "HUMANA-AZ"),
        ]:
            Payer.objects.get_or_create(insurance_id=ins_id, defaults=dict(
                name=name, payer_id=payer_id, eligibility_payer=name,
                submission_method="Clearinghouse", status="Active"))

    def _seed_patients(self):
        from patients.models import Patient, PatientInsurance
        demo = [
            dict(patient_id="P10042", name="Maria Sanchez", dob=date(1978, 3, 14), sex="F",
                 account_number="AC-77421", status="Active", primary_insurance="Medicare",
                 secondary_insurance="Aetna", balance=184.12, last_visit_date=date(2026, 6, 24)),
            dict(patient_id="P10043", name="Robert Kim", dob=date(1966, 11, 2), sex="M",
                 account_number="AC-77422", status="Needs review", primary_insurance="BCBS",
                 secondary_insurance="", balance=0, last_visit_date=date(2026, 6, 25)),
            dict(patient_id="P10044", name="Anita Patel", dob=date(1984, 1, 18), sex="F",
                 account_number="AC-77423", status="Active", primary_insurance="UnitedHealthcare",
                 secondary_insurance="", balance=42, last_visit_date=date(2026, 6, 21)),
            dict(patient_id="P10045", name="Thomas Green", dob=date(1951, 7, 9), sex="M",
                 account_number="AC-77424", status="Inactive", primary_insurance="Humana",
                 secondary_insurance="Medicaid", balance=650, last_visit_date=date(2026, 5, 29)),
        ]
        for d in demo:
            Patient.objects.get_or_create(patient_id=d["patient_id"], defaults=d)

        ins = [
            ("P10042", "primary", "Medicare", "MEDICARE-AZ", "1EG4-TE5-MK73", "Self",
             20.00, 184.12, "20%", date(2026, 1, 1), date(2026, 12, 31), "AUTH-2026-103", 12, 4),
            ("P10042", "secondary", "Aetna", "AETNA-AZ", "AET-4451002", "Self",
             0, 0, "0%", date(2026, 1, 1), date(2026, 12, 31), "", 0, 0),
        ]
        for pid, itype, pname, paid, subid, rel, copay, ded, coins, eff, stop, auth, va, vu in ins:
            p = Patient.objects.get(patient_id=pid)
            PatientInsurance.objects.get_or_create(
                patient=p, insurance_type=itype,
                defaults=dict(payer_name=pname, payer_id=paid, subscriber_id=subid,
                              relationship=rel, copay=copay, deductible_remaining=ded,
                              coinsurance=coins, effective_start=eff, effective_stop=stop,
                              authorization_number=auth, visits_authorized=va, visits_used=vu,
                              release_of_info=True, signature_on_file=True))

    def _seed_visits(self):
        from patients.models import Patient
        from visits.models import Visit, DiagnosisLine, ServiceLine
        demo = [
            dict(visit_id="V-20491", patient_id="P10042", date_of_service=date(2026, 6, 24),
                 visit_type="Office visit", reason="Knee pain follow-up", provider="Dr. Harlan",
                 facility="Apex Main", status="Ready for billing", charges=320, balance=184.12,
                 linked_claim="BB-2026-000183", chief_complaint="Right knee pain",
                 allergies="NKDA", blood_pressure="128/82", weight="184 lb"),
            dict(visit_id="V-20492", patient_id="P10043", date_of_service=date(2026, 6, 25),
                 visit_type="Injection", reason="Shoulder injection", provider="Dr. Harlan",
                 facility="Apex Main", status="Missing insurance", charges=480, balance=480),
            dict(visit_id="V-20493", patient_id="P10044", date_of_service=date(2026, 6, 21),
                 visit_type="Telehealth", reason="Medication review", provider="N. Carver NP",
                 facility="Telehealth", status="Missing diagnosis", charges=175, balance=175),
            dict(visit_id="V-20494", patient_id="P10045", date_of_service=date(2026, 5, 29),
                 visit_type="Office visit", reason="Diabetes follow-up", provider="Dr. Singh",
                 facility="Apex North", status="Primary claim submitted", charges=260, balance=0,
                 linked_claim="BB-2026-000177"),
        ]
        for d in demo:
            pid = d.pop("patient_id")
            patient = Patient.objects.get(patient_id=pid)
            v, created = Visit.objects.get_or_create(visit_id=d["visit_id"],
                                                      defaults=dict(**d, patient=patient))
            if created and v.visit_id == "V-20491":
                DiagnosisLine.objects.get_or_create(visit=v, pointer="A", defaults=dict(
                    icd_code="M25.561", description="Right knee pain"))
                DiagnosisLine.objects.get_or_create(visit=v, pointer="B", defaults=dict(
                    icd_code="M17.11", description="Unilateral primary osteoarthritis, right knee"))
                ServiceLine.objects.get_or_create(visit=v, cpt_code="99214", defaults=dict(
                    from_dos=v.date_of_service, to_dos=v.date_of_service, pos="11",
                    modifiers="25", diagnosis_pointers="A,B", charge=180, units=1, balance=180))
                ServiceLine.objects.get_or_create(visit=v, cpt_code="20610", defaults=dict(
                    from_dos=v.date_of_service, to_dos=v.date_of_service, pos="11",
                    modifiers="RT", diagnosis_pointers="A,B", charge=140, units=1, balance=140))

    def _seed_claims(self):
        from patients.models import Patient
        from visits.models import Visit
        from claims.models import Claim, ClaimValidationIssue
        demo = [
            dict(claim_id="BB-2026-000183", date_of_service=date(2026, 6, 24),
                 patient_id="P10042", visit_id="V-20491", provider="Dr. Harlan",
                 facility="Apex Main", payer="Medicare", payer_id_on_file="MEDICARE-AZ",
                 claim_type="837P", charges=320, paid=0, balance=320,
                 status="Validation failed", validation_status="Blocking",
                 submission_status="Not submitted",
                 last_response="Missing subscriber relationship", assigned_to="Lina"),
            dict(claim_id="BB-2026-000184", date_of_service=date(2026, 6, 25),
                 patient_id="P10043", visit_id="V-20492", provider="Dr. Harlan",
                 facility="Apex Main", payer="BCBS", payer_id_on_file="BCBS-AZ",
                 claim_type="837P", charges=480, paid=0, balance=480,
                 status="Draft", validation_status="Needs run",
                 submission_status="Draft", last_response="—", assigned_to="Omar"),
            dict(claim_id="BB-2026-000178", date_of_service=date(2026, 6, 7),
                 patient_id="P10042", provider="Dr. Singh", facility="Apex North",
                 payer="Aetna", payer_id_on_file="AETNA-AZ", claim_type="837P",
                 charges=220, paid=0, balance=220, status="Rejected",
                 validation_status="Passed", submission_status="Rejected",
                 last_response="277CA: invalid payer ID", assigned_to="Maya"),
            dict(claim_id="BB-2026-000171", date_of_service=date(2026, 5, 10),
                 patient_id="P10044", provider="N. Carver NP", facility="Apex Main",
                 payer="UnitedHealthcare", payer_id_on_file="UHC-AZ", claim_type="837P",
                 charges=180, paid=92, balance=88, status="Partially paid",
                 validation_status="Passed", submission_status="Accepted",
                 last_response="835 posted with deductible", assigned_to="Lina"),
        ]
        for d in demo:
            pid = d.pop("patient_id")
            vid = d.pop("visit_id", None)
            patient = Patient.objects.get(patient_id=pid)
            visit = Visit.objects.filter(visit_id=vid).first() if vid else None
            c, created = Claim.objects.get_or_create(
                claim_id=d["claim_id"], defaults=dict(**d, patient=patient, visit=visit))
            if created and c.claim_id == "BB-2026-000183":
                ClaimValidationIssue.objects.get_or_create(
                    claim=c, issue="Missing insured relationship",
                    defaults=dict(severity="Blocking", location="Patient and insured",
                                  why_it_matters="Required for 837P subscriber loop",
                                  resolved=False))
                ClaimValidationIssue.objects.get_or_create(
                    claim=c, issue="Deductible remaining",
                    defaults=dict(severity="Warning", location="Insurance",
                                  why_it_matters="Patient responsibility likely after adjudication",
                                  resolved=False))

    def _seed_payments(self):
        from payments.models import Payment
        demo = [
            dict(payment_id="PMT-9012", payment_date=date(2026, 6, 27), payer_type="Insurance",
                 payer_name="Medicare", method="EFT", check_auth_number="EFT-88301",
                 amount=12840.45, applied=12410.45, unapplied=430,
                 status="Posted with warnings", source="835 ERA"),
            dict(payment_id="PMT-9013", payment_date=date(2026, 6, 26), payer_type="Patient",
                 payer_name="Maria Sanchez", method="Card", check_auth_number="AUTH-2910",
                 amount=50, applied=50, unapplied=0, status="Reconciled", source="Manual"),
            dict(payment_id="PMT-9014", payment_date=date(2026, 6, 26), payer_type="Insurance",
                 payer_name="BCBS", method="Check", check_auth_number="CHK-10882",
                 amount=3120.78, applied=0, unapplied=3120.78, status="Unmatched", source="EOB"),
        ]
        for d in demo:
            Payment.objects.get_or_create(payment_id=d["payment_id"], defaults=d)

    def _seed_billing(self):
        from billing.models import WorkQueueItem
        demo = [
            dict(item_type="Validation failed", priority="High", patient_name="Maria Sanchez",
                 visit_id="V-20491", claim_id="BB-2026-000183", payer="Medicare",
                 provider="Dr. Harlan", amount=320, reason="Missing insured relationship",
                 assigned_to="Lina", age_days=2, next_action="Fix issue"),
            dict(item_type="ERA unmatched", priority="High", patient_name="Unknown from ERA",
                 visit_id="", claim_id="CLM-8834", payer="Medicare", provider="",
                 amount=430, reason="Possible match confidence 62%",
                 assigned_to="Maya", age_days=1, next_action="Manual match"),
            dict(item_type="Rejected claim", priority="High", patient_name="Ellen Brooks",
                 visit_id="V-20480", claim_id="BB-2026-000178", payer="Aetna",
                 provider="Dr. Singh", amount=220, reason="277CA invalid payer ID",
                 assigned_to="Omar", age_days=9, next_action="Correct payer"),
            dict(item_type="A/R follow-up", priority="Med", patient_name="Thomas Green",
                 visit_id="V-20460", claim_id="BB-2026-000177", payer="Humana",
                 provider="Dr. Singh", amount=650, reason="No payer response in 74 days",
                 assigned_to="Lina", age_days=74, next_action="Follow up"),
            dict(item_type="Secondary pending", priority="Med", patient_name="Victor Chen",
                 visit_id="V-20460", claim_id="BB-2026-000171", payer="UHC",
                 provider="N. Carver", amount=88, reason="Primary paid; secondary needed",
                 assigned_to="Maya", age_days=4, next_action="Create secondary"),
        ]
        for d in demo:
            WorkQueueItem.objects.get_or_create(claim_id=d["claim_id"], item_type=d["item_type"],
                                                 defaults=d)
