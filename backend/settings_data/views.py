from rest_framework import viewsets, filters, mixins, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    PracticeSetup,
    Provider,
    BillingProvider,
    ReferringProvider,
    Facility,
    Payer,
    CPTCode,
    DiagnosisCode,
    ChartAccount,
    ClaimDefaults,
    UserAccess,
)
from .serializers import (
    PracticeSetupSerializer,
    ProviderSerializer,
    BillingProviderSerializer,
    ReferringProviderSerializer,
    FacilitySerializer,
    PayerSerializer,
    CPTCodeSerializer,
    DiagnosisCodeSerializer,
    ChartAccountSerializer,
    ClaimDefaultsSerializer,
    UserAccessSerializer,
)


class PracticeSetupViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Singleton viewset for practice setup.
    GET  /settings/practice/  — retrieve the single record (pk=1, created on first access)
    PUT/PATCH /settings/practice/  — update it
    """

    serializer_class = PracticeSetupSerializer

    def _get_or_create_singleton(self):
        obj, _ = PracticeSetup.objects.get_or_create(pk=1, defaults={"company_name": ""})
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self._get_or_create_singleton()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self._get_or_create_singleton()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def get_object(self):
        return self._get_or_create_singleton()


class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "npi", "provider_id"]
    filterset_fields = ["status"]
    ordering_fields = ["name", "provider_id"]
    ordering = ["name"]


class BillingProviderViewSet(viewsets.ModelViewSet):
    queryset = BillingProvider.objects.all()
    serializer_class = BillingProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "group_npi"]
    filterset_fields = ["status", "organization_type"]
    ordering = ["name"]


class ReferringProviderViewSet(viewsets.ModelViewSet):
    queryset = ReferringProvider.objects.all()
    serializer_class = ReferringProviderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "npi", "provider_id", "specialty"]
    filterset_fields = ["status"]
    ordering = ["name"]


class FacilityViewSet(viewsets.ModelViewSet):
    queryset = Facility.objects.all()
    serializer_class = FacilitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "facility_id", "npi"]
    filterset_fields = ["status"]
    ordering = ["name"]


class PayerViewSet(viewsets.ModelViewSet):
    queryset = Payer.objects.all()
    serializer_class = PayerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "payer_id", "insurance_id"]
    filterset_fields = ["status", "submission_method"]
    ordering = ["name"]


class CPTCodeViewSet(viewsets.ModelViewSet):
    queryset = CPTCode.objects.all()
    serializer_class = CPTCodeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "description"]
    filterset_fields = ["status"]
    ordering = ["code"]


class DiagnosisCodeViewSet(viewsets.ModelViewSet):
    queryset = DiagnosisCode.objects.all()
    serializer_class = DiagnosisCodeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "description"]
    filterset_fields = ["status", "code_type", "billable"]
    ordering = ["code"]


class ChartAccountViewSet(viewsets.ModelViewSet):
    queryset = ChartAccount.objects.all()
    serializer_class = ChartAccountSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["account_id", "description", "account_type"]
    filterset_fields = ["status", "transaction_type"]
    ordering = ["account_id"]


class ClaimDefaultsViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Singleton viewset for claim defaults (tied to PracticeSetup pk=1).
    """

    serializer_class = ClaimDefaultsSerializer

    def _get_or_create_singleton(self):
        practice, _ = PracticeSetup.objects.get_or_create(pk=1, defaults={"company_name": ""})
        obj, _ = ClaimDefaults.objects.get_or_create(practice=practice)
        return obj

    def retrieve(self, request, *args, **kwargs):
        instance = self._get_or_create_singleton()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self._get_or_create_singleton()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def get_object(self):
        return self._get_or_create_singleton()


class UserAccessViewSet(viewsets.ModelViewSet):
    queryset = UserAccess.objects.all()
    serializer_class = UserAccessSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email"]
    filterset_fields = ["status", "role", "mfa_enabled"]
    ordering = ["username"]

    def create(self, request, *args, **kwargs):
        from django.contrib.auth.models import User as DjangoUser
        from rest_framework.response import Response
        from rest_framework import status as http_status

        data = request.data
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        email = data.get("email", "").strip()

        if not username:
            return Response({"detail": "Username is required."}, status=http_status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"detail": "Password is required."}, status=http_status.HTTP_400_BAD_REQUEST)
        if DjangoUser.objects.filter(username=username).exists():
            return Response({"detail": "A user with that username already exists."}, status=http_status.HTTP_400_BAD_REQUEST)

        django_user = DjangoUser.objects.create_user(username=username, password=password, email=email)

        ua_data = {k: v for k, v in data.items() if k != "password"}
        serializer = self.get_serializer(data=ua_data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)
