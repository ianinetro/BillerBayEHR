# BillerBay Master PRD, Design System, Build Plan, EDI Plan, and Interactive Mock-up

Version: 1.0  
Date: 2026-06-29  
Interactive mock-up: `BillerBay_Master_PRD_Interactive_Mockup.html`

## 1. Executive Summary

BillerBay is a billing-team-first EHR / EMR / Practice Management MVP that replaces OfficeAlly-style fragmented workflows with a connected, high-visibility operating system for medical billing and practice operations.

The MVP focuses on the revenue-cycle chain:

```text
Patient -> Demographics / Insurance -> Visit -> Diagnosis / CPT charge lines -> Claim -> Validation -> 837P submission -> 999/277CA -> 835/EOB -> Payment posting -> A/R -> Patient balance / secondary / appeal -> Closed
```

## 2. MVP Scope

Included:

- Patients, demographics, guarantor, insurance, eligibility summary, patient balance, related visits/claims/payments/activity.
- Visits, visit billing info, billing options, diagnosis codes, CPT/HCPCS lines, modifiers, POS, units, charges, payments, adjustments, balances.
- Claims, claim composer, CMS-1500 compatible data model, validation, submission, repair queues, secondary claims.
- Billing work queues: ready visits, missing data, validation failures, ready to submit, awaiting batch, rejected, denied, secondary, A/R, patient balances, stale claims, ERA exceptions.
- Payments/deposits, add payment, manual posting, ERA auto-post, applied payments, unmatched/unapplied/reconciliation, reversals.
- Settings/master data: company, offices, providers, billing providers, referring providers, facilities, payers, CPT, DX, chart accounts, preferences, users, roles, security.
- Audit activity for sensitive edits and financial actions.

Excluded from MVP unless explicitly added:

- Full appointment scheduling
- Full clinical charting templates
- eRx
- Patient portal
- Lab/inventory/marketing
- Advanced BI beyond operational queue summaries
- Full document management beyond billing attachments/proof records

## 3. BillerBay Command UI from design.md

All UI must follow design.md exactly:

- Deep ink shell `#12122C`
- Primary action blue `#0410BD`
- Hover/focus vivid blue `#3F4CFF`
- White/soft lavender/cyan surfaces
- Inter typography
- 4px spacing grid
- Dense operational tables
- Status badges with text, never color alone
- Modals/drawers/guided workflows with review steps
- Keyboard-first workflows and command palette
- PHI/PII masking, audit logs, export warnings, sensitive reveal logging
- Accessibility baseline WCAG 2.2 AA

## 4. Primary Modules

### Patients

Patient list, full profile page, demographics, insurance, eligibility summary, visits, claims, payments, notes/activity. Clicking a patient row opens a full patient profile page, not just a drawer.

### Visits

Visit list and full visit detail with visit info, billing info, billing options, claim linkage, payments/balances, notes/activity.

### Claims

Claim list and claim composer with operational sections: summary, patient/insured, payer, diagnosis, service lines, providers/facility, claim options, validation, submission history, payments/adjustments, notes/activity, CMS-1500 preview.

### Billing

Operational command queue with cards and work-item table. Includes ready visits, missing billing data, validation failures, ready to submit, awaiting batch, rejected, denied, secondary, A/R, patient balance, stale claims, ERA exceptions.

### Payments

Payments/deposits, add payment workflow, applied payments, manual posting, 835 ERA import, ERA auto-post, unmatched/unapplied, reversals, reconciliation.

### Settings

Practice setup, users/access, providers, billing providers, referring/supervising/ordering providers, facilities/locations, payers, CPT/HCPCS, DX, chart accounts, preferences, claim defaults, security, audit logs.

## 5. Smart Billing Rules

- Admit/discharge code logic
- Future DOS blocking
- Laterality/modifier mismatch detection
- Modifier 25/59 quarantine
- Visit/superbill/claim count mismatch alerts
- QA bucket reminders
- Hospice modifier suggestions
- Timely filing limit alerts by payer
- ERA exception isolation and reversal handling
- Unlimited filters and saved views
- ICD/CPT/HCPCS/NCCI/MUE/CARC/RARC intelligence
- Claim lifecycle view
- Eligibility proof snapshots
- CPT/DX hover previews in claim lists
- Deductible remaining tracker
- Unified Patient Control Number / Claim ID where feasible

## 6. EDI and Python Library Plan

Use real libraries where useful, but keep BillerBay's domain layer, validation layer, audit layer, and payer-rule layer under BillerBay control.

| Need | Candidate | BillerBay module |
|---|---|---|
| X12 validation / 997 / 999 | pyx12 | `edi/validators/pyx12_validator.py` |
| 835 parsing | edi-835-parser, openx12, py835 | `edi/parsers/x12_835_parser.py` |
| 837P/837I parsing | openx12, healthcare-io | `edi/parsers/x12_837_parser.py` |
| 837P generation | custom BillerBay builder + pyx12 validation | `edi/builders/x12_837p_builder.py` |
| CMS-1500 | fillpdf prototype, ReportLab production | `claims/cms1500/cms1500_pdf_renderer.py` |
| ICD-10-CM | CDC/CMS official files | `codes/importers/import_icd10cm.py` |
| HCPCS | CMS official public-use files | `codes/importers/import_hcpcs.py` |
| CPT | AMA licensed source | `codes/importers/import_cpt_licensed.py` |
| NCCI PTP/MUE | CMS NCCI files | `codes/importers/import_ncci_ptp.py`, `import_ncci_mue.py` |
| CARC/RARC | X12 official lists | `codes/importers/import_carc.py`, `import_rarc.py` |

## 7. Build Backlog

1. Design system foundation
2. Identity, permissions, audit
3. Master data/settings
4. Patients
5. Visits
6. Claims
7. EDI/clearinghouse
8. Payments/ERA
9. Billing queues/A/R
10. Reports/import/export
11. Interactive prototype parity

## 8. Acceptance Criteria

- Search across patients, visits, claims, payments, and settings.
- Process high-volume work from queues.
- Open patient, visit, and claim full detail pages.
- Validate claims before submission.
- Batch submit only ready claims.
- Track full claim lifecycle.
- Import/post ERA with exception handling.
- Support reversals and audited financial edits.
- Generate A/R and TFL work items.
- Apply BillerBay Command UI to every screen.

## 9. Mock-up

The included HTML file `BillerBay_Master_PRD_Interactive_Mockup.html` is the reference prototype. It should remain in sync with the PRD and demonstrate major flows with populated mock data.
