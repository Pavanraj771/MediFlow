from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuthOverviewView,
    CustomLoginView,
    GoogleLoginView,
    DoctorAccountRequestDecisionView,
    DoctorAccountRequestListView,
    LogoutView,
    RegisterView,
    SendEmailOTPView,
    VerifyEmailOTPView,
    UserListView,
    UserDeleteView,
    UserProfileView,
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
    path("doctor-requests/", DoctorAccountRequestListView.as_view(), name="doctor_requests"),
    path("doctor-requests/<uuid:pk>/decision/", DoctorAccountRequestDecisionView.as_view(), name="doctor_request_decision"),
    path("overview/", AuthOverviewView.as_view(), name="auth_overview"),
]
