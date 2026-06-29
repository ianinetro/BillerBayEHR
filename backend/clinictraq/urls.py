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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Logged out."})

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth endpoints
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/logout/", logout_view, name="logout"),

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
