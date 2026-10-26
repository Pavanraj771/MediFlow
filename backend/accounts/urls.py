from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuditLogListView,
    AuthOverviewView,
    CustomLoginView,
    DoctorAdminUpdateView,
    DoctorAccountRequestDecisionView,
    DoctorAccountRequestListView,
    GoogleLoginView,
    HospitalBroadcastViewSet,
    LogoutView,
    RegisterView,
    SendEmailOTPView,
    UserDeleteView,
    UserListView,
    UserProfileView,
    UserStatusToggleView,
    VerifyEmailOTPView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("email/send-otp/", SendEmailOTPView.as_view(), name="send_email_otp"),
    path("email/verify-otp/", VerifyEmailOTPView.as_view(), name="verify_email_otp"),
    path("login/", CustomLoginView.as_view(), name="login"),
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("me/", UserProfileView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<uuid:pk>/", UserDeleteView.as_view(), name="user_delete"),
    path("users/<uuid:pk>/status/", UserStatusToggleView.as_view(), name="user_status_toggle"),
    path("doctors/<uuid:pk>/", DoctorAdminUpdateView.as_view(), name="doctor_admin_update"),
    path("doctor-requests/", DoctorAccountRequestListView.as_view(), name="doctor_requests"),
    path("doctor-requests/<uuid:pk>/decision/", DoctorAccountRequestDecisionView.as_view(), name="doctor_request_decision"),
    path("audit-logs/", AuditLogListView.as_view(), name="audit_logs"),
    path("broadcasts/", HospitalBroadcastViewSet.as_view({"get": "list", "post": "create"}), name="broadcasts_list"),
    path("broadcasts/<uuid:pk>/", HospitalBroadcastViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}), name="broadcasts_detail"),
    path("overview/", AuthOverviewView.as_view(), name="auth_overview"),
]
