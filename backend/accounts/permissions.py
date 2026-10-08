from rest_framework import permissions
from .models import UserRole


class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to authenticated users with ADMIN role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == UserRole.ADMIN or request.user.is_superuser)
        )


class IsDoctorUserRole(permissions.BasePermission):
    """Allows access only to authenticated users with DOCTOR role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.DOCTOR
        )


class IsPatientUserRole(permissions.BasePermission):
    """Allows access only to authenticated users with PATIENT role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.PATIENT
        )


class IsDoctorOrAdminRole(permissions.BasePermission):
    """Allows access to either DOCTOR or ADMIN roles."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in [UserRole.DOCTOR, UserRole.ADMIN] or request.user.is_superuser)
        )
