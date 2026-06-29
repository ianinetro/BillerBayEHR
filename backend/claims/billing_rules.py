"""
Smart billing rules for claim validation.
Each rule function receives a Claim instance and returns a list of
(severity, issue, location, why_it_matters) tuples.
"""

from datetime import date


# Modifiers that require a 25/59 quarantine review
_QUARANTINE_MODIFIERS = {"25", "59", "XE", "XS", "XP", "XU"}

# CPT codes considered bilateral by definition (representative set)
_BILATERAL_CPTS = {
    "27447", "27446", "27445", "27130", "27132", "27134",  # bilateral knee/hip replacements
    "27395", "27396",
}
_BILATERAL_MODIFIERS = {"50"}
_LEFT_MODIFIERS = {"LT"}
_RIGHT_MODIFIERS = {"RT"}


def rule_future_dos(claim):
    issues = []
    today = date.today()
    if claim.date_of_service and claim.date_of_service > today:
        issues.append((
            "Blocking",
            f"Date of service {claim.date_of_service} is in the future",
            "Claim > Date of service",
            "Payers reject claims with a future date of service. Correct the DOS before submitting.",
        ))
    return issues


def rule_timely_filing(claim):
    issues = []
    if not claim.date_of_service:
        return issues
    today = date.today()
    days_elapsed = (today - claim.date_of_service).days
    # Try to look up timely filing limit from payer record
    limit = 365  # conservative default
    try:
        from settings_data.models import Payer
        payer_obj = Payer.objects.filter(name__iexact=claim.payer).first()
        if payer_obj and payer_obj.timely_filing_days:
            limit = payer_obj.timely_filing_days
    except Exception:
        pass
    if days_elapsed >= limit:
        issues.append((
            "Blocking",
            f"Timely filing limit of {limit} days exceeded ({days_elapsed} days since DOS)",
            "Claim > Date of service",
            f"{claim.payer} requires claims within {limit} days of service. This claim is past that deadline.",
        ))
    elif days_elapsed >= int(limit * 0.9):
        issues.append((
            "Warning",
            f"Approaching timely filing deadline ({days_elapsed}/{limit} days elapsed)",
            "Claim > Date of service",
            "Submit this claim soon to avoid rejection for late filing.",
        ))
    return issues


def rule_modifier_quarantine(claim):
    issues = []
    if not claim.visit:
        return issues
    try:
        svc_lines = claim.visit.service_lines.all()
    except Exception:
        return issues
    for line in svc_lines:
        mods = {m.strip().upper() for m in (line.modifiers or "").split() if m.strip()}
        flagged = mods & _QUARANTINE_MODIFIERS
        if flagged:
            issues.append((
                "Warning",
                f"CPT {line.cpt_code} uses modifier(s) {', '.join(sorted(flagged))} — quarantine review recommended",
                f"Service line > {line.cpt_code}",
                "Modifiers 25 and 59 (and X-modifiers) are high-audit targets. Ensure medical necessity "
                "documentation supports unbundling before submitting.",
            ))
    return issues


def rule_laterality_mismatch(claim):
    issues = []
    if not claim.visit:
        return issues
    try:
        svc_lines = claim.visit.service_lines.all()
    except Exception:
        return issues
    for line in svc_lines:
        mods = {m.strip().upper() for m in (line.modifiers or "").split() if m.strip()}
        has_bilateral_mod = bool(mods & _BILATERAL_MODIFIERS)
        has_left = bool(mods & _LEFT_MODIFIERS)
        has_right = bool(mods & _RIGHT_MODIFIERS)
        # Bilateral modifier on a code that already implies bilateral
        if line.cpt_code in _BILATERAL_CPTS and has_bilateral_mod:
            issues.append((
                "Warning",
                f"CPT {line.cpt_code} already implies bilateral — modifier 50 may cause duplicate payment",
                f"Service line > {line.cpt_code}",
                "Applying modifier 50 to an inherently bilateral procedure can trigger overpayment "
                "recoupment. Remove modifier 50 or verify payer policy.",
            ))
        # Both LT and RT on same line
        if has_left and has_right:
            issues.append((
                "Blocking",
                f"CPT {line.cpt_code} has both LT and RT modifiers on the same line",
                f"Service line > {line.cpt_code}",
                "LT and RT cannot appear together. Split into two service lines or use modifier 50.",
            ))
    return issues


def rule_duplicate_claim(claim):
    issues = []
    if not claim.visit:
        return issues
    try:
        svc_lines = list(claim.visit.service_lines.values_list("cpt_code", flat=True))
    except Exception:
        return issues
    if not svc_lines:
        return issues
    from claims.models import Claim
    active_statuses = [
        Claim.Status.DRAFT, Claim.Status.READY_TO_SUBMIT,
        Claim.Status.SUBMITTED, Claim.Status.ACCEPTED,
    ]
    for cpt in svc_lines:
        duplicate = (
            Claim.objects
            .filter(
                patient=claim.patient,
                date_of_service=claim.date_of_service,
                status__in=active_statuses,
                visit__service_lines__cpt_code=cpt,
            )
            .exclude(pk=claim.pk)
            .first()
        )
        if duplicate:
            issues.append((
                "Blocking",
                f"Possible duplicate: CPT {cpt} on {claim.date_of_service} already exists in claim {duplicate.claim_id}",
                f"Service line > {cpt}",
                "Submitting duplicate claims triggers automatic rejection and may lead to fraud flags. "
                "Review both claims and void or adjust the earlier one if appropriate.",
            ))
            break  # one duplicate warning is enough per claim
    return issues


def run_smart_rules(claim):
    """Run all smart billing rules and return a flat list of issue tuples."""
    rules = [
        rule_future_dos,
        rule_timely_filing,
        rule_modifier_quarantine,
        rule_laterality_mismatch,
        rule_duplicate_claim,
    ]
    all_issues = []
    for rule in rules:
        try:
            all_issues.extend(rule(claim))
        except Exception:
            pass
    return all_issues
