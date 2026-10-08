from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import DoctorAccountRequest, User, UserRole
from django.contrib.auth.hashers import make_password


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone_number",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "role", "is_active", "created_at"]


# Reserved admin credentials — cannot be used during self-registration
_ADMIN_RESERVED_USERNAME = "MediFlowAdmin"
_ADMIN_RESERVED_PASSWORD = "MediFlowAdmin@2751"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={"input_type": "password"})
    role = serializers.ChoiceField(
        choices=[
            (UserRole.PATIENT, "Patient"),
            (UserRole.DOCTOR, "Doctor"),
        ],
        default=UserRole.PATIENT,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "role",
        ]

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized

    def validate_username(self, value):
        if value:
            # Block the reserved administrator username
            if value == _ADMIN_RESERVED_USERNAME:
                raise serializers.ValidationError(
                    "This username is reserved for system administration. Please choose a different username."
                )
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        # Block the reserved administrator password
        if value == _ADMIN_RESERVED_PASSWORD:
            raise serializers.ValidationError(
                "This password is reserved for system administration. Please choose a different password."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Only allow PATIENT or DOCTOR roles via self-registration
        role = validated_data.get("role", UserRole.PATIENT)
        if role == UserRole.ADMIN:
            validated_data["role"] = UserRole.PATIENT
        user = User.objects.create_user(password=password, **validated_data)
        return user


class DoctorAccountRequestSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = DoctorAccountRequest
        fields = ["id", "email", "username", "password", "first_name", "last_name", "phone_number", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists() or DoctorAccountRequest.objects.filter(email=value, status=DoctorAccountRequest.STATUS_PENDING).exists():
            raise serializers.ValidationError("An account or pending request with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists() or DoctorAccountRequest.objects.filter(username=value, status=DoctorAccountRequest.STATUS_PENDING).exists():
            raise serializers.ValidationError("This username is already taken or has a pending request.")
        if value == _ADMIN_RESERVED_USERNAME:
            raise serializers.ValidationError("This username is reserved for system administration.")
        return value

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return DoctorAccountRequest.objects.create(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Supports login by username or email, adds custom claims to JWT."""

    # Add a username field alongside the default email field
    username = serializers.CharField(required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the default email field optional since we support username login
        self.fields["email"] = serializers.EmailField(required=False, allow_blank=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims embedded into JWT
        token["user_id"] = str(user.id)
        token["email"] = user.email
        token["username"] = user.username or ""
        token["role"] = user.role
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        username_input = attrs.get("username", "").strip()
        email_input = attrs.get("email", "").strip().lower()

        # Resolve user by username if provided, otherwise by email
        resolved_email = email_input
        if username_input:
            try:
                user_obj = User.objects.get(username=username_input)
                resolved_email = user_obj.email
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"username": "No account found with this username."}
                )

        if not resolved_email:
            raise serializers.ValidationError(
                {"username": "Please provide your username or email."}
            )

        # Inject resolved email into attrs so parent serializer can authenticate
        attrs["email"] = resolved_email
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=True)
