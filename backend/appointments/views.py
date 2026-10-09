from datetime import datetime, timedelta, date, time
from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.db.models import Q
from .models import DoctorProfile, DoctorSchedule, DoctorLeave, Appointment, AppointmentStatus
from .serializers import (
    DoctorProfileSerializer,
    DoctorScheduleSerializer,
    DoctorLeaveSerializer,
    AppointmentSerializer
)
from accounts.models import User, UserRole

class IsDoctorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR)

class DoctorProfileListView(generics.ListAPIView):
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        dept = self.request.query_params.get('department')
        if dept:
            return DoctorProfile.objects.filter(department=dept)
        return DoctorProfile.objects.all()

class DoctorScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [IsDoctorUser]

    def get_queryset(self):
        return DoctorSchedule.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

class DoctorLeaveViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorLeaveSerializer
    permission_classes = [IsDoctorUser]

    def get_queryset(self):
        return DoctorLeave.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

class AvailableSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, doctor_id):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"detail": "Date parameter is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

        # Get doctor schedule for the day
        day_of_week = target_date.weekday()
        schedules = DoctorSchedule.objects.filter(doctor_id=doctor_id, day_of_week=day_of_week, is_active=True)
        if not schedules.exists():
            return Response([])

        schedule = schedules.first()
        slot_duration = timedelta(minutes=schedule.slot_duration_minutes)
        start_dt = timezone.make_aware(datetime.combine(target_date, schedule.start_time))
        end_dt = timezone.make_aware(datetime.combine(target_date, schedule.end_time))

        # Get booked appointments
        booked_appointments = Appointment.objects.filter(
            doctor_id=doctor_id,
            appointment_datetime__date=target_date,
            status=AppointmentStatus.SCHEDULED
        ).values_list('appointment_datetime', flat=True)

        booked_slots = set(booked_appointments)

        # Get doctor leaves
        leaves = DoctorLeave.objects.filter(
            doctor_id=doctor_id,
            start_datetime__lt=end_dt,
            end_datetime__gt=start_dt
        )

        slots = []
        current_dt = start_dt
        now = timezone.now()

        while current_dt + slot_duration <= end_dt:
            if current_dt > now:
                is_leave = any(leave.start_datetime <= current_dt < leave.end_datetime for leave in leaves)
                if not is_leave and current_dt not in booked_slots:
                    slots.append(current_dt.isoformat())
            current_dt += slot_duration

        return Response(slots)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return Appointment.objects.filter(patient=user)
        elif user.role == UserRole.DOCTOR:
            return Appointment.objects.filter(doctor=user)
        return Appointment.objects.all()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserRole.PATIENT:
            raise ValidationError("Only patients can book appointments.")
        
        doctor_id = self.request.data.get('doctor')
        appointment_dt = serializer.validated_data.get('appointment_datetime')
        
        # Check if doctor has a schedule
        day_of_week = appointment_dt.weekday()
        schedule = DoctorSchedule.objects.filter(doctor_id=doctor_id, day_of_week=day_of_week, is_active=True).first()
        if not schedule:
            raise ValidationError("Doctor is not scheduled for this day.")
        
        serializer.validated_data['duration_minutes'] = schedule.slot_duration_minutes
        
        try:
            serializer.save(patient=user)
        except IntegrityError:
            raise ValidationError("This slot is already booked.")
