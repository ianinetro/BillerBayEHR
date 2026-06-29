"""
ClinicTraq root URL configuration.

API surface:
  /api/patients/   — patient demographics and insurance records
  /api/visits/     — clinical visits, service lines, diagnosis codes
  /api/claims/     — CMS-1500 / 837P claim submissions
  /api/payments/   — ERA/EOB payment posting and adjustments
  /api/billing/    — billing rules, fee schedules, and batch operations
  /api/settings/   — practice, provider, and payer configuration
  /api/audit/      — activity log and change history
  /admin/          — Django admin interface
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # Core clinical & financial APIs
    path("api/patients/", include("patients.urls")),
    path("api/visits/", include("visits.urls")),
    path("api/claims/", include("claims.urls")),
    path("api/payments/", include("payments.urls")),

    # Practice management APIs
    path("api/billing/", include("billing.urls")),
    path("api/settings/", include("settings_data.urls")),

    # Audit trail
    path("api/audit/", include("audit.urls")),
]
