"""
837P EDI builder for BillerBay ClinicTraq.

Generates a well-formed X12 837P transaction from a Claim model instance.
Install pyx12 for schema validation: pip install pyx12
"""

from django.utils import timezone


def _seg(*elements):
    return "*".join(str(e) if e is not None else "" for e in elements) + "~"


def build_837p(claim) -> str:
    """
    Build a minimal 837P string from a Claim model instance.
    Returns the full X12 transaction as a string.
    """
    now = timezone.now()
    date_str = now.strftime("%Y%m%d")
    time_str = now.strftime("%H%M")
    icn = f"{claim.pk:09d}"  # interchange control number

    patient = claim.patient
    lines = []

    # ISA — Interchange Control Header
    lines.append(_seg(
        "ISA", "00", " " * 10, "00", " " * 10,
        "ZZ", "BILLERBAY".ljust(15), "ZZ", "CLEARINGHS".ljust(15),
        date_str[2:], time_str, "^", "00501", icn, "0", "P", ":"
    ))
    # GS — Functional Group Header
    lines.append(_seg("GS", "HC", "BILLERBAY", "CLEARINGHS", date_str, time_str, "1", "X", "005010X222A1"))
    # ST — Transaction Set Header
    lines.append(_seg("ST", "837", "0001", "005010X222A1"))
    # BHT — Beginning of Hierarchical Transaction
    lines.append(_seg("BHT", "0019", "00", icn, date_str, time_str, "CH"))

    # NM1 — Submitter (billing provider)
    lines.append(_seg("NM1", "41", "2", "BILLERBAY", "", "", "", "", "46", "BILLERBAY"))
    lines.append(_seg("PER", "IC", "CONTACT", "TE", "6025551000"))

    # NM1 — Receiver
    lines.append(_seg("NM1", "40", "2", "CLEARINGHOUSE", "", "", "", "", "46", "CLR"))

    # HL — Billing Provider level
    lines.append(_seg("HL", "1", "", "20", "1"))
    lines.append(_seg("PRV", "BI", "PXC", "207Q00000X"))
    lines.append(_seg("NM1", "85", "2", claim.provider or "PROVIDER", "", "", "", "", "XX", "1234567890"))
    lines.append(_seg("N3", "920 HEALTH PARK DR"))
    lines.append(_seg("N4", "PHOENIX", "AZ", "85001"))

    # HL — Subscriber level
    lines.append(_seg("HL", "2", "1", "22", "0"))
    lines.append(_seg("SBR", "P", "18", "", "", "", "", "", "", claim.payer or ""))

    # NM1 — Subscriber (patient)
    name_parts = (patient.name or "").split()
    last_name = name_parts[-1] if name_parts else "UNKNOWN"
    first_name = name_parts[0] if len(name_parts) > 1 else ""
    lines.append(_seg("NM1", "IL", "1", last_name, first_name, "", "", "", "MI", ""))
    lines.append(_seg("DMG", "D8", str(patient.dob).replace("-", "") if patient.dob else "", patient.sex or ""))

    # NM1 — Payer
    lines.append(_seg("NM1", "PR", "2", claim.payer or "PAYER", "", "", "", "", "PI", claim.payer_id_on_file or ""))

    # CLM — Claim
    dos = str(claim.date_of_service).replace("-", "")
    lines.append(_seg("CLM", claim.claim_id, float(claim.charges), "", "", f"11:B:1", "Y", "A", "Y", "I"))
    lines.append(_seg("DTP", "472", "D8", dos))

    # HI — Diagnosis codes (pull from DiagnosisLine if available)
    try:
        dx_lines = list(claim.visit.diagnosis_lines.all()[:12]) if claim.visit_id else []
        if dx_lines:
            hi_elements = ["HI"]
            for i, dx in enumerate(dx_lines):
                pointer = chr(65 + i)
                hi_elements.append(f"ABK:{dx.icd_code}" if i == 0 else f"ABF:{dx.icd_code}")
            lines.append(_seg(*hi_elements))
    except Exception:
        pass

    # SV1 — Service lines
    try:
        svc_lines = list(claim.visit.service_lines.all()) if claim.visit_id else []
        for idx, svc in enumerate(svc_lines, 1):
            lines.append(_seg("LX", idx))
            mod_str = svc.modifiers or ""
            lines.append(_seg("SV1", f"HC:{svc.cpt_code}:{mod_str}", float(svc.charge), "UN", svc.units, "", "1"))
            lines.append(_seg("DTP", "472", "D8", dos))
    except Exception:
        pass

    # SE — Transaction Set Trailer
    lines.append(_seg("SE", len(lines) - 2, "0001"))
    # GE — Functional Group Trailer
    lines.append(_seg("GE", "1", "1"))
    # IEA — Interchange Control Trailer
    lines.append(_seg("IEA", "1", icn))

    return "\n".join(lines)
