"""
835 ERA parser for BillerBay ClinicTraq.

Parses an X12 835 string and returns a structured dict with service-line
granularity, dynamic delimiter detection, CPT codes, and remark codes.
"""

import io
import zipfile
from typing import Any


def _detect_delimiters(content: str) -> tuple[str, str, str]:
    """
    Extract element, component, and segment delimiters from the ISA header.
    ISA is fixed-width: element separator is at index 3, component at index 104,
    segment terminator is the character immediately after ISA16 value.
    Falls back to X12 defaults (*  : ~) if detection fails.
    """
    if not content.startswith("ISA"):
        return "*", ":", "~"
    element_sep = content[3]
    # The ISA segment has 16 fields; field 16 is 1 char, followed by segment term.
    # Safe approach: split on element_sep, take position after the 16th element.
    parts = content.split(element_sep)
    if len(parts) >= 17:
        component_sep = parts[16][0] if parts[16] else ":"
        seg_term = parts[16][1] if len(parts[16]) > 1 else "~"
    else:
        component_sep = ":"
        seg_term = "~"
    return element_sep, component_sep, seg_term


def parse_835(content: str) -> dict[str, Any]:
    """
    Parse an X12 835 ERA transaction.

    Returns a dict with header info and a list of service-line level claim rows.
    Each row in `claims` represents one (SVC, CAS) combination — one CPT code
    with one adjustment reason — matching Clarity's grain.

    Shape:
        {
            "payer_name": str,
            "payer_id": str,
            "check_number": str,
            "payment_amount": float,
            "payment_date": str,   # YYYYMMDD
            "claims": [
                {
                    "claim_id": str,
                    "patient_name": str,
                    "dos": str,           # YYYYMMDD from DTM*472
                    "claim_status": str,  # CLP-02 X12 status code
                    "claim_paid": float,  # CLP-level paid amount
                    "cpt_code": str,      # from SVC segment
                    "charged_amount": float,   # SVC billed
                    "paid": float,             # SVC paid
                    "adjustment_group": str,   # CAS group code
                    "adjustment_reason": str,  # CAS reason code
                    "adjustment_amount": float,
                    "remark_code": str,        # from LQ segment
                },
                ...  # one row per (SVC × CAS reason)
            ]
        }
    """
    element_sep, _comp_sep, seg_term = _detect_delimiters(content)

    segments = [s.strip() for s in content.split(seg_term) if s.strip()]

    result: dict[str, Any] = {
        "payer_name": "",
        "payer_id": "",
        "check_number": "",
        "payment_amount": 0.0,
        "payment_date": "",
        "claims": [],
    }

    current_claim: dict[str, Any] | None = None
    current_svc: dict[str, Any] | None = None

    def _float(val: str) -> float:
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    def _flush_svc() -> None:
        """Emit a row for each CAS reason on the current SVC."""
        if current_claim is None or current_svc is None:
            return
        adjustments = current_svc.get("adjustments", [])
        remark = current_svc.get("remark_code", "")
        if adjustments:
            for adj in adjustments:
                result["claims"].append({
                    "claim_id": current_claim["claim_id"],
                    "patient_name": current_claim["patient_name"],
                    "dos": current_claim["dos"],
                    "claim_status": current_claim["claim_status"],
                    "claim_paid": current_claim["claim_paid"],
                    "cpt_code": current_svc["cpt_code"],
                    "charged_amount": current_svc["charged_amount"],
                    "paid": current_svc["paid"],
                    "adjustment_group": adj["group"],
                    "adjustment_reason": adj["reason"],
                    "adjustment_amount": adj["amount"],
                    "remark_code": remark,
                })
        else:
            # SVC with no adjustments (fully paid line)
            result["claims"].append({
                "claim_id": current_claim["claim_id"],
                "patient_name": current_claim["patient_name"],
                "dos": current_claim["dos"],
                "claim_status": current_claim["claim_status"],
                "claim_paid": current_claim["claim_paid"],
                "cpt_code": current_svc["cpt_code"],
                "charged_amount": current_svc["charged_amount"],
                "paid": current_svc["paid"],
                "adjustment_group": "",
                "adjustment_reason": "",
                "adjustment_amount": 0.0,
                "remark_code": remark,
            })

    for seg in segments:
        els = seg.split(element_sep)
        seg_id = els[0]

        if seg_id == "BPR" and len(els) > 2:
            result["payment_amount"] = _float(els[2])

        elif seg_id == "TRN" and len(els) > 2:
            result["check_number"] = els[2]

        elif seg_id == "DTM" and len(els) > 2 and els[1] == "405":
            result["payment_date"] = els[2]

        elif seg_id == "NM1" and len(els) > 3 and els[1] == "PR":
            result["payer_name"] = els[3]
            result["payer_id"] = els[9] if len(els) > 9 else ""

        elif seg_id == "CLP" and len(els) > 4:
            # Flush previous SVC before starting a new claim
            _flush_svc()
            current_svc = None
            current_claim = {
                "claim_id": els[1],
                "patient_name": "",
                "dos": "",
                "claim_status": els[2] if len(els) > 2 else "",
                "claim_paid": _float(els[4]),
            }

        elif seg_id == "NM1" and current_claim is not None and len(els) > 3 and els[1] == "QC":
            last = els[3] if len(els) > 3 else ""
            first = els[4] if len(els) > 4 else ""
            current_claim["patient_name"] = f"{last} {first}".strip()

        elif seg_id == "DTM" and current_claim is not None and len(els) > 2 and els[1] == "472":
            current_claim["dos"] = els[2]

        elif seg_id == "SVC" and current_claim is not None and len(els) > 2:
            # Flush previous SVC first
            _flush_svc()
            # SVC*HC:99213:mod*billed*paid*...
            svc_code_field = els[1]
            # CPT is the second component of the composite (after HC:)
            parts = svc_code_field.split(_comp_sep)
            cpt = parts[1] if len(parts) > 1 else parts[0]
            current_svc = {
                "cpt_code": cpt,
                "charged_amount": _float(els[2]),
                "paid": _float(els[3]) if len(els) > 3 else 0.0,
                "adjustments": [],
                "remark_code": "",
            }

        elif seg_id == "CAS" and current_svc is not None and len(els) > 3:
            # CAS can repeat up to 3 reason triplets: CAS*group*reason*amount[*...]
            i = 1
            while i + 2 <= len(els) - 1:
                group = els[i]
                reason = els[i + 1]
                amount = _float(els[i + 2])
                if group and reason:
                    current_svc["adjustments"].append({
                        "group": group,
                        "reason": reason,
                        "amount": amount,
                    })
                i += 3

        elif seg_id == "LQ" and current_svc is not None and len(els) > 2:
            # LQ*HE*remark_code — remark codes (RARC)
            if els[1] in ("HE", "RX"):
                current_svc["remark_code"] = els[2]

    # Flush the last SVC
    _flush_svc()

    return result


def extract_835_from_zip(zip_bytes: bytes) -> str:
    """
    Extract the first .835 (or .edi) member from a ZIP archive and return its
    text content.  Raises ValueError if no suitable member is found.
    """
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        members = zf.namelist()
        target = None
        for name in members:
            lower = name.lower()
            if lower.endswith(".835") or lower.endswith(".edi"):
                target = name
                break
        # Fall back to any .txt that looks like X12 (starts with ISA)
        if target is None:
            for name in members:
                if name.lower().endswith(".txt"):
                    sample = zf.read(name)[:20].decode("utf-8", errors="replace")
                    if sample.startswith("ISA"):
                        target = name
                        break
        if target is None:
            raise ValueError(
                f"No .835 / .edi file found in ZIP. Members: {members}"
            )
        raw = zf.read(target)
        return raw.decode("utf-8", errors="replace")
