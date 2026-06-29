"""
835 ERA parser for BillerBay ClinicTraq.

Parses an X12 835 string and returns a structured dict suitable for
creating Payment and ERAException records.
"""


def parse_835(content: str) -> dict:
    """
    Parse a minimal X12 835 ERA transaction.

    Returns:
        {
            "payer_name": str,
            "check_number": str,
            "payment_amount": float,
            "payment_date": str,   # YYYYMMDD
            "claims": [
                {
                    "claim_id": str,
                    "patient_name": str,
                    "dos": str,
                    "paid": float,
                    "adjustments": [{"group": str, "reason": str, "amount": float}],
                }
            ]
        }
    """
    segments = [s.strip() for s in content.replace("\n", "").split("~") if s.strip()]
    result = {
        "payer_name": "",
        "check_number": "",
        "payment_amount": 0.0,
        "payment_date": "",
        "claims": [],
    }
    current_claim = None

    for seg in segments:
        elements = seg.split("*")
        loop_id = elements[0]

        if loop_id == "BPR" and len(elements) > 2:
            try:
                result["payment_amount"] = float(elements[2])
            except (ValueError, IndexError):
                pass

        elif loop_id == "TRN" and len(elements) > 2:
            result["check_number"] = elements[2]

        elif loop_id == "DTM" and len(elements) > 2 and elements[1] == "405":
            result["payment_date"] = elements[2]

        elif loop_id == "NM1" and len(elements) > 3 and elements[1] == "PR":
            result["payer_name"] = elements[3]

        elif loop_id == "CLP" and len(elements) > 3:
            current_claim = {
                "claim_id": elements[1],
                "patient_name": "",
                "dos": "",
                "paid": float(elements[4]) if len(elements) > 4 else 0.0,
                "adjustments": [],
            }
            result["claims"].append(current_claim)

        elif loop_id == "NM1" and current_claim is not None and len(elements) > 3 and elements[1] == "QC":
            current_claim["patient_name"] = f"{elements[3]} {elements[4]}".strip()

        elif loop_id == "DTM" and current_claim is not None and len(elements) > 2 and elements[1] == "472":
            current_claim["dos"] = elements[2]

        elif loop_id == "CAS" and current_claim is not None and len(elements) > 3:
            current_claim["adjustments"].append({
                "group": elements[1],
                "reason": elements[2],
                "amount": float(elements[3]) if len(elements) > 3 else 0.0,
            })

    return result
