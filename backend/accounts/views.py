from django.db.models import Q
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.db import transaction
from django.db import IntegrityError
from django.conf import settings
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
import logging
from datetime import timedelta
import secrets
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from google.auth.transport import requests as google_requests
from google.auth import exceptions as google_exceptions
from google.oauth2 import id_token
import jwt as pyjwt

from .models import DoctorAccountRequest, EmailOTP, User, UserRole
from .permissions import IsAdminUserRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    DoctorAccountRequestSerializer,
    LogoutSerializer,
    RegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint.
    Creates a new user and immediately returns a JWT token pair for seamless UX.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        email = str(request.data.get("email", "")).strip().lower()
        try:
            otp_record = EmailOTP.objects.select_for_update().get(email=email, verified=True, expires_at__gt=timezone.now())
        except EmailOTP.DoesNotExist:
            return Response({"email": ["Verify this email address with the OTP sent to it before creating an account."]}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get("role") == UserRole.DOCTOR:
            serializer = DoctorAccountRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            otp_record.delete()
            return Response({"message": "Doctor account request sent to the administrator for review."}, status=status.HTTP_201_CREATED)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp_record.delete()

        # Generate JWT tokens for auto-login
        refresh = RefreshToken.for_user(user)
        refresh["user_id"] = str(user.id)
        refresh["email"] = user.email
        refresh["username"] = user.username or ""
        refresh["role"] = user.role
        refresh["first_name"] = user.first_name
        refresh["last_name"] = user.last_name
        refresh["full_name"] = user.full_name

        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response(
            {
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
                "access": access_token,
                "refresh": refresh_token,
            },
            status=status.HTTP_201_CREATED,
        )


class SendEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        if not email:
            return Response({"email": ["Enter an email address."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except ValidationError:
            return Response({"email": ["Enter a valid email address."]}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists() or DoctorAccountRequest.objects.filter(email=email, status=DoctorAccountRequest.STATUS_PENDING).exists():
            return Response({"email": ["An account or pending doctor request already uses this email."]}, status=status.HTTP_400_BAD_REQUEST)
        existing = EmailOTP.objects.filter(email=email).first()
        if existing and timezone.now() - existing.last_sent_at < timedelta(seconds=60):
            return Response({"detail": "Please wait a minute before requesting another OTP."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        if not settings.EMAIL_HOST_PASSWORD:
            return Response({"detail": "Email delivery is not configured. Contact the MediFlow administrator."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        code = f"{secrets.randbelow(1_000_000):06d}"
        otp_record, _ = EmailOTP.objects.update_or_create(
            email=email,
            defaults={"code_hash": make_password(code), "expires_at": timezone.now() + timedelta(minutes=10), "verified": False, "attempts": 0, "last_sent_at": timezone.now()},
        )
        try:
            send_mail(
                subject="Your MediFlow email verification code",
                message=f"Your MediFlow verification code is {code}. It expires in 10 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            otp_record.delete()
            return Response({"detail": "Could not send the verification email. Please try again later."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"message": "Verification code sent. Check your email."}, status=status.HTTP_200_OK)


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        code = str(request.data.get("otp", "")).strip()
        otp_record = EmailOTP.objects.filter(email=email).first()
        if not otp_record or otp_record.expires_at <= timezone.now() or otp_record.verified:
            return Response({"detail": "This verification code is invalid or expired. Request a new code."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.attempts >= 5:
            otp_record.delete()
            return Response({"detail": "Too many incorrect attempts. Request a new code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        otp_record.attempts += 1
        if not check_password(code, otp_record.code_hash):
            otp_record.save(update_fields=["attempts"])
            return Response({"detail": "Incorrect verification code."}, status=status.HTTP_400_BAD_REQUEST)
        otp_record.verified = True
        otp_record.save(update_fields=["verified", "attempts"])
        return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)


class CustomLoginView(TokenObtainPairView):
    """
    Login endpoint authenticating via email and password.
    Returns JWT access & refresh tokens along with user identity payload.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        login_value = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        pending = DoctorAccountRequest.objects.filter(status=DoctorAccountRequest.STATUS_PENDING).filter(
            Q(username=login_value) | Q(email__iexact=login_value)
        ).first()
        if pending and check_password(password, pending.password):
            return Response({"detail": "Your doctor account request is awaiting administrator approval."}, status=status.HTTP_403_FORBIDDEN)
        return super().post(request, *args, **kwargs)


class GoogleLoginView(APIView):
    """Verify a Google ID token and issue MediFlow JWTs for the verified account."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "Google sign in is not configured. Set GOOGLE_CLIENT_ID on the backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        credential = request.data.get("credential", "")
        if not isinstance(credential, str) or not credential:
            return Response({"detail": "A Google credential is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            claims = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60,
            )
        except google_exceptions.TransportError as error:
            logger.warning("Google ID token verification could not reach Google (%s).", type(error).__name__)
            return Response(
                {"detail": "MediFlow could not reach Google to verify this sign-in. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as error:
            try:
                unverified_claims = pyjwt.decode(
                    credential,
                    options={"verify_signature": False, "verify_exp": False, "verify_aud": False},
                )
            except pyjwt.InvalidTokenError:
                logger.warning("Google ID token verification rejected a malformed credential (%s).", type(error).__name__)
                return Response(
                    {"detail": "Google returned an invalid sign-in credential. Close the Google dialog and try again."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            token_audience = unverified_claims.get("aud")
            token_audiences = token_audience if isinstance(token_audience, list) else [token_audience]
            if settings.GOOGLE_CLIENT_ID not in token_audiences:
                logger.warning("Google sign-in client ID mismatch: frontend token audience differs from backend configuration.")
                return Response(
                    {"detail": "The Google button is using a different client ID than the backend. Restart the frontend after updating frontend/.env.local."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if isinstance(error, google_exceptions.InvalidValue):
                verification_message = str(error)
                if verification_message.startswith("Token used too early"):
                    detail = "The backend clock is behind Google. Sync the computer running Django to internet time and try again."
                    reason = "issued-at time is in the future"
                elif verification_message.startswith("Token expired"):
                    detail = "Google's sign-in token expired before MediFlow could verify it. Try signing in again."
                    reason = "token expired"
                elif verification_message.startswith("Token has wrong audience"):
                    detail = "Google's token audience format was not accepted. Confirm the Google Web client ID and try again."
                    reason = "token audience rejected by verifier"
                elif "requires the cryptography package" in verification_message:
                    detail = "The backend is missing a cryptography dependency. Install the backend requirements and restart Django."
                    reason = "cryptography dependency missing"
                else:
                    detail = "Google's verifier rejected a token value. Check the backend Google authentication dependencies."
                    reason = "unrecognized invalid token value"
            elif isinstance(error, google_exceptions.MalformedError):
                detail = "Google's token signature could not be validated. Refresh the Google sign-in and try again."
                reason = "malformed token or signature"
            else:
                detail = "Google's token could not be verified. Check the backend Google authentication dependencies."
                reason = "unexpected verifier error"

            logger.warning("Google ID token verification failed after audience matched (%s: %s).", type(error).__name__, reason)
            return Response(
                {"detail": detail},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = str(claims.get("email", "")).strip().lower()
        if not email or claims.get("email_verified") is not True:
            return Response({"detail": "Use a Google account with a verified email address."}, status=status.HTTP_403_FORBIDDEN)

        if DoctorAccountRequest.objects.filter(email__iexact=email, status=DoctorAccountRequest.STATUS_PENDING).exists():
            return Response({"detail": "A doctor account request for this email is awaiting administrator approval."}, status=status.HTTP_403_FORBIDDEN)

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            display_name = str(claims.get("name", "")).strip()
            first_name = str(claims.get("given_name", "")).strip()
            last_name = str(claims.get("family_name", "")).strip()
            if not first_name:
                name_parts = display_name.split(maxsplit=1)
                first_name = name_parts[0] if name_parts else "Google"
                last_name = last_name or (name_parts[1] if len(name_parts) > 1 else "User")
            try:
                with transaction.atomic():
                    user = User.objects.create_user(
                        email=email,
                        password=None,
                        first_name=first_name,
                        last_name=last_name or "User",
                        role=UserRole.PATIENT,
                    )
            except IntegrityError:
                user = User.objects.filter(email__iexact=email).first()
                if user is None:
                    raise

        if not user.is_active:
            return Response({"detail": "This MediFlow account is inactive. Contact an administrator."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        refresh["user_id"] = str(user.id)
        refresh["email"] = user.email
        refresh["username"] = user.username or ""
        refresh["role"] = user.role
        refresh["first_name"] = user.first_name
        refresh["last_name"] = user.last_name
        refresh["full_name"] = user.full_name
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class DoctorAccountRequestListView(generics.ListAPIView):
    serializer_class = DoctorAccountRequestSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        return DoctorAccountRequest.objects.filter(status=DoctorAccountRequest.STATUS_PENDING)


class DoctorAccountRequestDecisionView(APIView):
    permission_classes = [IsAdminUserRole]

    @transaction.atomic
    def post(self, request, pk):
        try:
            doctor_request = DoctorAccountRequest.objects.select_for_update().get(pk=pk, status=DoctorAccountRequest.STATUS_PENDING)
        except DoctorAccountRequest.DoesNotExist:
            return Response({"detail": "Pending doctor request not found."}, status=status.HTTP_404_NOT_FOUND)

        decision = request.data.get("decision")
        if decision not in ("approve", "reject"):
            return Response({"detail": "Decision must be approve or reject."}, status=status.HTTP_400_BAD_REQUEST)
        if decision == "approve":
            if User.objects.filter(Q(email=doctor_request.email) | Q(username=doctor_request.username)).exists():
                return Response({"detail": "Email or username is already assigned to a user."}, status=status.HTTP_409_CONFLICT)
            User.objects.create(
                email=doctor_request.email, username=doctor_request.username,
                password=doctor_request.password, first_name=doctor_request.first_name,
                last_name=doctor_request.last_name, phone_number=doctor_request.phone_number,
                role=UserRole.DOCTOR, is_active=True,
            )
            doctor_request.status = DoctorAccountRequest.STATUS_APPROVED
        else:
            doctor_request.status = DoctorAccountRequest.STATUS_REJECTED
        doctor_request.reviewed_at = timezone.now()
        doctor_request.save(update_fields=["status", "reviewed_at"])
        return Response({"message": f"Doctor request {doctor_request.status.lower()}."})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update currently authenticated user's profile.
    Scope: Authenticated users.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """
    Revoke current session and blacklist refresh token if available.
    Scope: Authenticated users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid()
        refresh_token = serializer.validated_data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Token might already be expired or blacklisting not active
                pass

        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class UserListView(generics.ListAPIView):
    """
    Admin-only endpoint to inspect all hospital users.
    Supports filtering by role and searching by name/email.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")

        if role and role in UserRole.values:
            queryset = queryset.filter(role=role)

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        return queryset


class UserDeleteView(APIView):
    """Permanently delete a patient or doctor account. Admins cannot be deleted here."""
    permission_classes = [IsAdminUserRole]

    @transaction.atomic
    def delete(self, request, pk):
        try:
            account = User.objects.select_for_update().get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        if account.role not in (UserRole.PATIENT, UserRole.DOCTOR):
            return Response(
                {"detail": "Only patient and doctor accounts can be deleted here."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthOverviewView(APIView):
    """
    Returns high-level RBAC statistics for administrative metrics.
    Scope: Authenticated users (Admin gets full stats, others get summary).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_users = User.objects.count()
        patients_count = User.objects.filter(role=UserRole.PATIENT).count()
        doctors_count = User.objects.filter(role=UserRole.DOCTOR).count()
        admins_count = User.objects.filter(role=UserRole.ADMIN).count()

        return Response({
            "status": "operational",
            "active_user": {
                "id": str(request.user.id),
                "email": request.user.email,
                "role": request.user.role,
                "full_name": request.user.full_name,
            },
            "stats": {
                "total_users": total_users,
                "patients": patients_count,
                "doctors": doctors_count,
                "administrators": admins_count,
            }
        })
