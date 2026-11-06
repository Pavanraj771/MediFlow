from datetime import datetime, timedelta
from django.utils import timezone
from django.db import models
from django.db.models import Q
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404

from .models import (
    PatientProfile, DoctorProfile, DoctorSchedule, DoctorLeave,
    Appointment, AppointmentStatus, ConsultationNote, VitalSigns, Prescription,
    CareMessage, LabTest, PatientVitalsLog, PrescriptionRefill, RefillStatus,
    Notification, NotificationType, DoctorReview
)
from .serializers import (
    PatientProfileSerializer, DoctorProfileSerializer,
    DoctorScheduleSerializer, DoctorLeaveSerializer,
    AppointmentSerializer, ConsultationNoteSerializer,
    CareMessageSerializer, LabTestSerializer,
    PatientVitalsLogSerializer, PrescriptionRefillSerializer,
    PrescriptionSerializer,
    NotificationSerializer, DoctorReviewSerializer,
)
from accounts.models import User, UserRole


# ── Permission helpers ────────────────────────────────────────────────────────
class IsDoctorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR)

class IsPatientUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)


# ── Patient Profile ───────────────────────────────────────────────────────────
class PatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [IsPatientUser]

    def get_object(self):
        profile, _ = PatientProfile.objects.get_or_create(user=self.request.user)
        return profile


# ── Doctor Profile ────────────────────────────────────────────────────────────
class DoctorProfileListView(generics.ListAPIView):
    queryset = DoctorProfile.objects.select_related('user').all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        dept = self.request.query_params.get('department')
        qs = DoctorProfile.objects.select_related('user').all()
        if dept:
            qs = qs.filter(department=dept)
        return qs


class DoctorProfileMeView(generics.RetrieveUpdateAPIView):
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsDoctorUser]

    def get_object(self):
        profile, _ = DoctorProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        return DoctorProfileSerializer


# ── Doctor Schedule ───────────────────────────────────────────────────────────
class DoctorScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [IsDoctorUser]

    def get_queryset(self):
        return DoctorSchedule.objects.filter(doctor=self.request.user).order_by('date', 'day_of_week', 'start_time')

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        today = timezone.localdate()
        if instance.date and instance.date < today:
            raise ValidationError("Cannot remove schedules of dates that are already finished.")
        return super().destroy(request, *args, **kwargs)


# ── Doctor Leave ──────────────────────────────────────────────────────────────
class DoctorLeaveViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorLeaveSerializer
    permission_classes = [IsDoctorUser]

    def get_queryset(self):
        return DoctorLeave.objects.filter(doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)


# ── Available Slots ───────────────────────────────────────────────────────────
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

        day_of_week = target_date.weekday()
        schedules = DoctorSchedule.objects.filter(
            doctor_id=doctor_id,
            is_active=True
        ).filter(
            Q(date=target_date) | (Q(date__isnull=True) & Q(day_of_week=day_of_week))
        ).order_by('start_time')
        if not schedules.exists():
            return Response([])

        booked_slots = set(
            Appointment.objects.filter(
                doctor_id=doctor_id,
                appointment_datetime__date=target_date,
                status=AppointmentStatus.SCHEDULED
            ).values_list('appointment_datetime', flat=True)
        )

        leaves = DoctorLeave.objects.filter(
            doctor_id=doctor_id,
            start_datetime__date__lte=target_date,
            end_datetime__date__gte=target_date
        )

        slots = []
        now = timezone.now()

        for schedule in schedules:
            slot_duration = timedelta(minutes=schedule.slot_duration_minutes)
            start_dt = timezone.make_aware(datetime.combine(target_date, schedule.start_time))
            end_dt = timezone.make_aware(datetime.combine(target_date, schedule.end_time))

            current_dt = start_dt
            while current_dt + slot_duration <= end_dt:
                if current_dt > now:
                    is_leave = any(leave.start_datetime <= current_dt < leave.end_datetime for leave in leaves)
                    if not is_leave and current_dt not in booked_slots:
                        slots.append(current_dt.isoformat())
                current_dt += slot_duration

        slots.sort()
        return Response(slots)


def check_and_update_no_show_appointments():
    """
    Checks if current time is past any scheduled appointment time where consultation
    has not been completed. Marks them as NO_SHOW and notifies the patient and doctor.
    """
    now = timezone.now()
    overdue_appts = Appointment.objects.filter(
        status=AppointmentStatus.SCHEDULED,
        appointment_datetime__lt=now
    ).select_related('patient', 'doctor')

    for apt in overdue_appts:
        if hasattr(apt, 'consultation') and apt.consultation:
            continue

        apt.status = AppointmentStatus.NO_SHOW
        apt.save(update_fields=['status', 'updated_at'])

        dt_str = timezone.localtime(apt.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')

        # 1. Notify the patient
        try:
            if not Notification.objects.filter(
                recipient=apt.patient,
                notification_type=NotificationType.APPOINTMENT_MISSED,
                related_id=str(apt.id)
            ).exists():
                Notification.objects.create(
                    recipient=apt.patient,
                    title="Appointment Missed (No-Show)",
                    message=f"You missed your scheduled appointment with Dr. {apt.doctor.full_name} on {dt_str}. Since the scheduled time has passed without completion, it has been marked as a No-Show. Please re-schedule if you still require consultation.",
                    notification_type=NotificationType.APPOINTMENT_MISSED,
                    related_id=str(apt.id)
                )
        except Exception:
            pass

        # 2. Notify the doctor
        try:
            if not Notification.objects.filter(
                recipient=apt.doctor,
                notification_type=NotificationType.APPOINTMENT_MISSED,
                related_id=str(apt.id)
            ).exists():
                Notification.objects.create(
                    recipient=apt.doctor,
                    title="Patient No-Show",
                    message=f"Patient {apt.patient.full_name} missed their scheduled appointment on {dt_str}. It has been marked as a No-Show.",
                    notification_type=NotificationType.APPOINTMENT_MISSED,
                    related_id=str(apt.id)
                )
        except Exception:
            pass


def check_and_create_30min_reminders():
    """
    Checks for any scheduled appointments that start within the next 30 minutes
    (i.e. now <= appointment_datetime <= now + 30 minutes).
    Sends the 30-minute reminder notification to the patient and doctor.
    """
    now = timezone.now()
    in_30_mins = now + timedelta(minutes=30)
    upcoming_appts = Appointment.objects.filter(
        status=AppointmentStatus.SCHEDULED,
        appointment_datetime__gt=now,
        appointment_datetime__lte=in_30_mins,
    ).select_related('doctor', 'patient')

    for apt in upcoming_appts:
        dt_str = timezone.localtime(apt.appointment_datetime).strftime('%I:%M %p')
        date_str = timezone.localtime(apt.appointment_datetime).strftime('%b %d, %Y')

        # 1. Notify patient 30 minutes before appointment
        try:
            if not Notification.objects.filter(
                recipient=apt.patient,
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                related_id=str(apt.id)
            ).exists():
                Notification.objects.create(
                    recipient=apt.patient,
                    title="Upcoming Appointment Reminder (in 30 mins)",
                    message=f"Reminder: You have an appointment with Dr. {apt.doctor.full_name} scheduled for {dt_str} on {date_str} (starting in 30 minutes). Please be prepared!",
                    notification_type=NotificationType.APPOINTMENT_REMINDER,
                    related_id=str(apt.id),
                )
        except Exception:
            pass

        # 2. Notify doctor 30 minutes before appointment
        try:
            if not Notification.objects.filter(
                recipient=apt.doctor,
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                related_id=str(apt.id)
            ).exists():
                Notification.objects.create(
                    recipient=apt.doctor,
                    title="Upcoming Patient Consultation (in 30 mins)",
                    message=f"Reminder: Consultation with patient {apt.patient.full_name} is scheduled for {dt_str} on {date_str} (starting in 30 minutes).",
                    notification_type=NotificationType.APPOINTMENT_REMINDER,
                    related_id=str(apt.id),
                )
        except Exception:
            pass


# ── Appointments ──────────────────────────────────────────────────────────────
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        check_and_update_no_show_appointments()
        check_and_create_30min_reminders()
        user = self.request.user
        qs = Appointment.objects.select_related(
            'patient', 'doctor', 'doctor__doctor_profile',
            'consultation'
        ).prefetch_related('consultation__prescriptions', 'consultation__vitals')

        if user.role == UserRole.PATIENT:
            qs = qs.filter(patient=user)
        elif user.role == UserRole.DOCTOR:
            qs = qs.filter(doctor=user)
        # else ADMIN gets all

        patient_param = self.request.query_params.get('patient')
        if patient_param:
            qs = qs.filter(patient_id=patient_param)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.order_by('-appointment_datetime')

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserRole.PATIENT:
            raise ValidationError("Only patients can book appointments.")
        doctor_id = self.request.data.get('doctor')
        appointment_dt = serializer.validated_data.get('appointment_datetime')
        day_of_week = appointment_dt.weekday()

        local_dt = timezone.localtime(appointment_dt) if timezone.is_aware(appointment_dt) else appointment_dt
        appt_time = local_dt.time()

        schedule = DoctorSchedule.objects.filter(
            doctor_id=doctor_id,
            is_active=True,
            start_time__lte=appt_time,
            end_time__gt=appt_time
        ).filter(
            Q(date=appointment_dt.date()) | (Q(date__isnull=True) & Q(day_of_week=day_of_week))
        ).first()

        if not schedule:
            raise ValidationError("Doctor has no active schedule covering this appointment time.")

        serializer.validated_data['duration_minutes'] = schedule.slot_duration_minutes
        try:
            appointment = serializer.save(patient=user)
            try:
                dt_str = timezone.localtime(appointment.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')
                Notification.objects.create(
                    recipient=user,
                    title="Appointment Confirmed",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} is confirmed for {dt_str}.",
                    notification_type=NotificationType.APPOINTMENT_SCHEDULED,
                    related_id=str(appointment.id),
                )
                Notification.objects.create(
                    recipient=appointment.doctor,
                    title="New Appointment Booked",
                    message=f"Patient {user.full_name} booked an appointment for {dt_str}.",
                    notification_type=NotificationType.APPOINTMENT_SCHEDULED,
                    related_id=str(appointment.id),
                )
            except Exception:
                pass
        except IntegrityError:
            raise ValidationError("This slot is already booked.")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        requested_status = request.data.get('status')
        if requested_status:
            user = request.user
            if requested_status == AppointmentStatus.CANCELLED:
                if user.role == UserRole.PATIENT and instance.patient != user:
                    raise PermissionDenied("You can only cancel your own appointments.")
                if user.role == UserRole.DOCTOR and instance.doctor != user:
                    raise PermissionDenied("You can only cancel your own appointments.")
                if instance.status == AppointmentStatus.COMPLETED:
                    return Response({'detail': 'Completed appointments cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
                instance.status = AppointmentStatus.CANCELLED
                instance.save()
                try:
                    dt_str = timezone.localtime(instance.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')
                    Notification.objects.create(
                        recipient=instance.patient,
                        title="Appointment Cancelled",
                        message=f"Your appointment with Dr. {instance.doctor.full_name} for {dt_str} was cancelled.",
                        notification_type=NotificationType.APPOINTMENT_CANCELLED,
                        related_id=str(instance.id),
                    )
                    Notification.objects.create(
                        recipient=instance.doctor,
                        title="Appointment Cancelled",
                        message=f"Appointment with {instance.patient.full_name} on {dt_str} was cancelled.",
                        notification_type=NotificationType.APPOINTMENT_CANCELLED,
                        related_id=str(instance.id),
                    )
                except Exception:
                    pass
            elif user.role in (UserRole.ADMIN, UserRole.DOCTOR):
                instance.status = requested_status
                instance.save()
        return super().update(request, *args, partial=partial, **kwargs)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != instance.status and getattr(self.request.user, "role", None) == UserRole.ADMIN:
            from accounts.views import record_audit_log
            record_audit_log(
                self.request.user,
                "APPOINTMENT_STATUS_CHANGED",
                f"Appointment {instance.id} status changed from {old_status} to {instance.status} by admin.",
                "WARNING" if instance.status == "CANCELLED" else "INFO"
            )

    @action(detail=True, methods=['post', 'patch'], url_path='cancel', permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """Patient, doctor, or admin cancels an appointment."""
        appointment = self.get_object()
        user = request.user
        if user.role == UserRole.PATIENT and appointment.patient != user:
            raise PermissionDenied("You can only cancel your own appointments.")
        if user.role == UserRole.DOCTOR and appointment.doctor != user:
            raise PermissionDenied("You can only cancel your own appointments.")

        if appointment.status == AppointmentStatus.CANCELLED:
            return Response({'detail': 'Appointment is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.status == AppointmentStatus.COMPLETED:
            return Response({'detail': 'Completed appointments cannot be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip() or request.data.get('cancellation_reason', '').strip()
        if user.role == UserRole.DOCTOR and not reason:
            return Response({'detail': 'Please provide a reason for cancelling this appointment.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = AppointmentStatus.CANCELLED
        appointment.cancellation_reason = reason
        appointment.cancelled_by_role = user.role
        appointment.save()

        try:
            dt_str = timezone.localtime(appointment.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')
            if user.role == UserRole.DOCTOR:
                Notification.objects.create(
                    recipient=appointment.patient,
                    title="Appointment Cancelled by Doctor",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} for {dt_str} has been cancelled by the doctor due to: {reason}",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
                Notification.objects.create(
                    recipient=appointment.doctor,
                    title="Appointment Cancelled",
                    message=f"You cancelled the appointment with {appointment.patient.full_name} for {dt_str}. Reason: {reason}",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
            else:
                Notification.objects.create(
                    recipient=appointment.patient,
                    title="Appointment Cancelled",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} for {dt_str} has been cancelled successfully.",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
                Notification.objects.create(
                    recipient=appointment.doctor,
                    title="Appointment Cancelled by Patient",
                    message=f"Patient {appointment.patient.full_name} cancelled their appointment scheduled for {dt_str}.",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
        except Exception:
            pass

        if user.role == UserRole.ADMIN:
            from accounts.views import record_audit_log
            record_audit_log(
                user,
                "APPOINTMENT_CANCELLED",
                f"Appointment {appointment.id} cancelled by admin {user.email}.",
                "WARNING"
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='update-status', permission_classes=[IsDoctorUser])
    def update_status(self, request, pk=None):
        """Doctor marks appointment as COMPLETED or NO_SHOW."""
        appointment = self.get_object()
        if appointment.doctor != request.user:
            raise PermissionDenied("You can only update your own appointments.")
        new_status = request.data.get('status')
        allowed = [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED]
        if new_status not in [s.value for s in allowed]:
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == AppointmentStatus.CANCELLED:
            reason = request.data.get('reason', '').strip() or request.data.get('cancellation_reason', '').strip()
            if not reason:
                return Response({'detail': 'Please provide a reason for cancelling this appointment.'}, status=status.HTTP_400_BAD_REQUEST)
            appointment.cancellation_reason = reason
            appointment.cancelled_by_role = UserRole.DOCTOR
            appointment.status = AppointmentStatus.CANCELLED
            appointment.save()

            try:
                dt_str = timezone.localtime(appointment.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')
                Notification.objects.create(
                    recipient=appointment.patient,
                    title="Appointment Cancelled by Doctor",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} for {dt_str} has been cancelled by the doctor due to: {reason}",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
                Notification.objects.create(
                    recipient=appointment.doctor,
                    title="Appointment Cancelled",
                    message=f"You cancelled the appointment with {appointment.patient.full_name} for {dt_str}. Reason: {reason}",
                    notification_type=NotificationType.APPOINTMENT_CANCELLED,
                    related_id=str(appointment.id),
                )
            except Exception:
                pass
            return Response(AppointmentSerializer(appointment).data)

        appointment.status = new_status
        appointment.save()

        if new_status == AppointmentStatus.COMPLETED:
            try:
                Notification.objects.create(
                    recipient=appointment.patient,
                    title="Appointment Completed - Rate Your Doctor",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} has been successfully completed. We value your feedback! Please take a moment to rate and review your consultation experience.",
                    notification_type=NotificationType.APPOINTMENT_COMPLETED,
                    related_id=str(appointment.id),
                )
            except Exception:
                pass

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['get', 'post', 'put', 'patch'], url_path='consult', permission_classes=[IsDoctorUser])
    def consult(self, request, pk=None):
        """Doctor submits or retrieves consultation notes, vitals, prescriptions."""
        appointment = self.get_object()
        if appointment.doctor != request.user:
            raise PermissionDenied("You can only add consultations to your own appointments.")

        if request.method == 'GET':
            try:
                serializer = ConsultationNoteSerializer(appointment.consultation)
                return Response(serializer.data)
            except ConsultationNote.DoesNotExist:
                return Response({'detail': 'No consultation yet.'}, status=status.HTTP_404_NOT_FOUND)

        # POST / PUT / PATCH
        try:
            instance = appointment.consultation
            serializer = ConsultationNoteSerializer(instance, data=request.data, partial=True)
        except ConsultationNote.DoesNotExist:
            instance = None
            serializer = ConsultationNoteSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        if instance:
            consultation = serializer.update(instance, serializer.validated_data)
        else:
            consultation = serializer.save(appointment=appointment)

        # Mark appointment as COMPLETED if not already
        if appointment.status == AppointmentStatus.SCHEDULED:
            appointment.status = AppointmentStatus.COMPLETED
            appointment.save()
            try:
                Notification.objects.create(
                    recipient=appointment.patient,
                    title="Appointment Completed - Rate Your Doctor",
                    message=f"Your appointment with Dr. {appointment.doctor.full_name} has been successfully completed. We value your feedback! Please take a moment to rate and review your consultation experience.",
                    notification_type=NotificationType.APPOINTMENT_COMPLETED,
                    related_id=str(appointment.id),
                )
            except Exception:
                pass

        return Response(ConsultationNoteSerializer(consultation).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='doctor-emergency', permission_classes=[IsDoctorUser])
    def doctor_emergency(self, request):
        """
        Doctor declares emergency unavailability for 15m, 20m, 30m, 60m, custom minutes, or ends it.
        Flags scheduled appointments during this window as is_emergency_affected=True.
        """
        doctor = request.user
        action = request.data.get('action', 'SET')
        profile, _ = DoctorProfile.objects.get_or_create(user=doctor)
        now = timezone.now()

        if action == 'END':
            profile.emergency_until = None
            profile.emergency_reason = ''
            profile.save(update_fields=['emergency_until', 'emergency_reason'])

            DoctorLeave.objects.filter(
                doctor=doctor,
                start_datetime__lte=now,
                end_datetime__gt=now,
                reason__startswith='Doctor Emergency'
            ).update(end_datetime=now)

            return Response({
                'is_emergency': False,
                'message': 'Emergency mode ended successfully.'
            })

        try:
            minutes = int(request.data.get('minutes', 15))
        except (ValueError, TypeError):
            minutes = 15

        reason = request.data.get('reason', 'Emergency Procedure').strip() or 'Emergency Procedure'
        emergency_until = now + timedelta(minutes=minutes)

        profile.emergency_until = emergency_until
        profile.emergency_reason = reason
        profile.save(update_fields=['emergency_until', 'emergency_reason'])

        DoctorLeave.objects.create(
            doctor=doctor,
            start_datetime=now,
            end_datetime=emergency_until,
            reason=f"Doctor Emergency: {reason}"
        )

        affected_appts = Appointment.objects.filter(
            doctor=doctor,
            status=AppointmentStatus.SCHEDULED,
            appointment_datetime__gte=now,
            appointment_datetime__lt=emergency_until
        )
        count = affected_appts.count()
        until_str = timezone.localtime(emergency_until).strftime('%I:%M %p')
        for apt in affected_appts:
            apt.is_emergency_affected = True
            apt.emergency_notes = f"Doctor declared emergency ({reason}) until {until_str}"
            apt.save(update_fields=['is_emergency_affected', 'emergency_notes'])

        # Notify Admins
        admins = User.objects.filter(role=UserRole.ADMIN, is_active=True)
        for admin in admins:
            try:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Doctor Emergency: Dr. {doctor.full_name}",
                    message=f"Dr. {doctor.full_name} ({profile.get_department_display()}) declared an emergency ({reason}) until {until_str}. {count} appointment(s) require reassignment.",
                    notification_type=NotificationType.DOCTOR_EMERGENCY,
                    related_id=str(doctor.id)
                )
            except Exception:
                pass

        return Response({
            'is_emergency': True,
            'emergency_until': emergency_until.isoformat(),
            'emergency_reason': reason,
            'affected_count': count,
            'message': f"Emergency mode active for {minutes} min until {until_str}. {count} scheduled appointment(s) flagged for reassignment."
        })

    @action(detail=False, methods=['get'], url_path='emergency-status', permission_classes=[IsDoctorUser])
    def emergency_status(self, request):
        doctor = request.user
        profile = getattr(doctor, 'doctor_profile', None)
        now = timezone.now()
        is_emergency = bool(profile and profile.emergency_until and profile.emergency_until > now)
        remaining_seconds = int((profile.emergency_until - now).total_seconds()) if is_emergency else 0

        affected_count = 0
        if is_emergency:
            affected_count = Appointment.objects.filter(
                doctor=doctor,
                status=AppointmentStatus.SCHEDULED,
                is_emergency_affected=True
            ).count()

        return Response({
            'is_emergency': is_emergency,
            'emergency_until': profile.emergency_until.isoformat() if is_emergency else None,
            'emergency_reason': profile.emergency_reason if is_emergency else '',
            'remaining_seconds': max(0, remaining_seconds),
            'affected_count': affected_count,
        })

    @action(detail=True, methods=['get'], url_path='replacement-candidates', permission_classes=[permissions.IsAuthenticated])
    def replacement_candidates(self, request, pk=None):
        """
        Find available doctors from the SAME department with slots closest to the actual time slot
        and greater than or equal to the actual time slot (slot_datetime >= actual_datetime).
        """
        appointment = self.get_object()
        orig_doctor = appointment.doctor
        dept_code = getattr(getattr(orig_doctor, 'doctor_profile', None), 'department', None)
        target_dt = appointment.appointment_datetime
        now = timezone.now()

        candidate_doctors = User.objects.filter(
            role=UserRole.DOCTOR,
            is_active=True,
            doctor_profile__department=dept_code
        ).exclude(id=orig_doctor.id).select_related('doctor_profile')

        candidates = []
        target_date = target_dt.date()

        for doc in candidate_doctors:
            doc_profile = doc.doctor_profile
            # Check candidate doctor emergency
            doc_emergency_until = doc_profile.emergency_until if doc_profile and doc_profile.emergency_until and doc_profile.emergency_until > now else None

            # Look ahead up to 7 days from target date
            for day_offset in range(0, 7):
                check_date = target_date + timedelta(days=day_offset)
                day_of_week = check_date.weekday()

                schedules = DoctorSchedule.objects.filter(
                    doctor=doc,
                    is_active=True
                ).filter(
                    Q(date=check_date) | (Q(date__isnull=True) & Q(day_of_week=day_of_week))
                ).order_by('start_time')

                if not schedules.exists():
                    continue

                booked_slots = set(
                    Appointment.objects.filter(
                        doctor=doc,
                        appointment_datetime__date=check_date,
                        status=AppointmentStatus.SCHEDULED
                    ).values_list('appointment_datetime', flat=True)
                )

                leaves = DoctorLeave.objects.filter(
                    doctor=doc,
                    start_datetime__date__lte=check_date,
                    end_datetime__date__gte=check_date
                )

                for schedule in schedules:
                    slot_duration = timedelta(minutes=schedule.slot_duration_minutes)
                    start_dt = timezone.make_aware(datetime.combine(check_date, schedule.start_time))
                    end_dt = timezone.make_aware(datetime.combine(check_date, schedule.end_time))

                    current_dt = start_dt
                    while current_dt + slot_duration <= end_dt:
                        # Constraint: slot >= actual appointment time AND slot > now
                        if current_dt >= target_dt and current_dt > now:
                            # Not on leave
                            is_leave = any(leave.start_datetime <= current_dt < leave.end_datetime for leave in leaves)
                            # Not during emergency
                            is_in_emergency = bool(doc_emergency_until and current_dt < doc_emergency_until)
                            # Not already booked
                            if not is_leave and not is_in_emergency and current_dt not in booked_slots:
                                diff_minutes = (current_dt - target_dt).total_seconds() / 60
                                time_label = (
                                    "Same time" if diff_minutes == 0
                                    else f"+{int(diff_minutes)} min" if diff_minutes < 60
                                    else f"+{int(diff_minutes // 60)}h {int(diff_minutes % 60)}m" if diff_minutes < 1440
                                    else f"+{int(diff_minutes // 1440)} day(s)"
                                )
                                candidates.append({
                                    'doctor_id': str(doc.id),
                                    'doctor_name': doc.full_name,
                                    'doctor_email': doc.email,
                                    'doctor_phone': doc.phone_number,
                                    'department': dept_code,
                                    'department_display': doc_profile.get_department_display(),
                                    'consultation_fee': str(doc_profile.consultation_fee),
                                    'years_experience': doc_profile.years_experience,
                                    'slot_datetime': current_dt.isoformat(),
                                    'slot_formatted': timezone.localtime(current_dt).strftime('%b %d, %Y at %I:%M %p'),
                                    'diff_minutes': int(diff_minutes),
                                    'is_same_day': (current_dt.date() == target_date),
                                    'time_label': time_label,
                                    'is_recommended': False,
                                })
                        current_dt += slot_duration

        # Sort strictly closest to actual timeslot ascending
        candidates.sort(key=lambda x: x['diff_minutes'])

        if candidates:
            candidates[0]['is_recommended'] = True

        return Response({
            'appointment_id': str(appointment.id),
            'patient_name': appointment.patient.full_name,
            'original_doctor_id': str(orig_doctor.id),
            'original_doctor_name': orig_doctor.full_name,
            'original_appointment_datetime': appointment.appointment_datetime.isoformat(),
            'original_appointment_formatted': timezone.localtime(appointment.appointment_datetime).strftime('%b %d, %Y at %I:%M %p'),
            'department': dept_code,
            'department_display': orig_doctor.doctor_profile.get_department_display() if hasattr(orig_doctor, 'doctor_profile') else dept_code,
            'total_found': len(candidates),
            'recommended': candidates[0] if candidates else None,
            'candidates': candidates[:20],  # Return up to top 20 closest matches
        })

    @action(detail=True, methods=['post'], url_path='reassign-doctor', permission_classes=[permissions.IsAuthenticated])
    def reassign_doctor(self, request, pk=None):
        if request.user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
            raise PermissionDenied("Only administrators or doctors can reassign appointments.")

        appointment = self.get_object()
        new_doctor_id = request.data.get('new_doctor_id')
        new_slot_str = request.data.get('new_slot_datetime')
        notes = request.data.get('notes', '').strip()

        if not new_doctor_id:
            return Response({'detail': 'New doctor ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        new_doctor = get_object_or_404(User, id=new_doctor_id, role=UserRole.DOCTOR)

        orig_dept = getattr(getattr(appointment.doctor, 'doctor_profile', None), 'department', None)
        new_dept = getattr(getattr(new_doctor, 'doctor_profile', None), 'department', None)
        if orig_dept and new_dept and orig_dept != new_dept:
            return Response({'detail': f'Replacement doctor must belong to the same department ({orig_dept}).'}, status=status.HTTP_400_BAD_REQUEST)

        if new_slot_str:
            try:
                new_slot_dt = datetime.fromisoformat(new_slot_str.replace('Z', '+00:00'))
                if timezone.is_naive(new_slot_dt):
                    new_slot_dt = timezone.make_aware(new_slot_dt)
            except Exception:
                return Response({'detail': 'Invalid new_slot_datetime format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            new_slot_dt = appointment.appointment_datetime

        # Conflict checks
        is_booked = Appointment.objects.filter(
            doctor=new_doctor,
            appointment_datetime=new_slot_dt,
            status=AppointmentStatus.SCHEDULED
        ).exclude(id=appointment.id).exists()
        if is_booked:
            return Response({'detail': 'The selected replacement doctor already has an appointment booked at this timeslot.'}, status=status.HTTP_400_BAD_REQUEST)

        on_leave = DoctorLeave.objects.filter(
            doctor=new_doctor,
            start_datetime__lte=new_slot_dt,
            end_datetime__gt=new_slot_dt
        ).exists()
        if on_leave:
            return Response({'detail': 'The selected replacement doctor is on leave/emergency during this timeslot.'}, status=status.HTTP_400_BAD_REQUEST)

        old_doctor = appointment.doctor
        old_dt_str = timezone.localtime(appointment.appointment_datetime).strftime('%b %d, %Y at %I:%M %p')
        new_dt_str = timezone.localtime(new_slot_dt).strftime('%b %d, %Y at %I:%M %p')
        now = timezone.now()

        with transaction.atomic():
            appointment.reassigned_from_doctor = old_doctor
            appointment.doctor = new_doctor
            appointment.appointment_datetime = new_slot_dt
            appointment.is_emergency_affected = False
            reassign_note = f"Reassigned from Dr. {old_doctor.full_name} to Dr. {new_doctor.full_name} by {request.user.full_name} ({request.user.role}). {notes}".strip()
            appointment.emergency_notes = reassign_note
            appointment.save()

        dept_display = new_doctor.doctor_profile.get_department_display() if hasattr(new_doctor, 'doctor_profile') else ''
        try:
            # 1. Notify Patient
            Notification.objects.create(
                recipient=appointment.patient,
                title="Appointment Reassigned: Dr. " + new_doctor.full_name,
                message=f"Due to an emergency with Dr. {old_doctor.full_name}, your appointment has been reassigned to Dr. {new_doctor.full_name} ({dept_display}) for {new_dt_str}. Your appointment remains confirmed.",
                notification_type=NotificationType.APPOINTMENT_REASSIGNED,
                related_id=str(appointment.id)
            )
            # 2. Notify Replacement Doctor
            Notification.objects.create(
                recipient=new_doctor,
                title="Emergency Transfer: New Appointment Assigned",
                message=f"You have been assigned patient {appointment.patient.full_name} for {new_dt_str} (transferred from Dr. {old_doctor.full_name}).",
                notification_type=NotificationType.APPOINTMENT_REASSIGNED,
                related_id=str(appointment.id)
            )
            # 3. Notify Original Doctor
            Notification.objects.create(
                recipient=old_doctor,
                title="Appointment Transferred",
                message=f"Your scheduled appointment with {appointment.patient.full_name} ({old_dt_str}) has been reassigned to Dr. {new_doctor.full_name} for {new_dt_str}.",
                notification_type=NotificationType.APPOINTMENT_REASSIGNED,
                related_id=str(appointment.id)
            )
        except Exception:
            pass

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


# ── Patient list for a Doctor ─────────────────────────────────────────────────
class DoctorPatientListView(generics.ListAPIView):
    """Returns distinct patients that have had appointments with the logged-in doctor."""
    permission_classes = [IsDoctorUser]

    def list(self, request, *args, **kwargs):
        doctor = request.user
        today_date = timezone.localdate()
        filter_param = request.query_params.get('filter')

        appointments = (
            Appointment.objects.filter(doctor=doctor)
            .select_related('patient', 'patient__patient_profile')
            .order_by('-appointment_datetime')
        )
        if filter_param == 'today':
            appointments = appointments.filter(appointment_datetime__date=today_date)

        # Build unique patient map (latest appointment first)
        seen = set()
        result = []
        for appt in appointments:
            p = appt.patient
            if p.id not in seen:
                seen.add(p.id)
                appt_count = Appointment.objects.filter(doctor=doctor, patient=p).count()
                visited_count = Appointment.objects.filter(doctor=doctor, patient=p, status=AppointmentStatus.COMPLETED).count()
                has_today = Appointment.objects.filter(doctor=doctor, patient=p, appointment_datetime__date=today_date).exists()
                profile = getattr(p, 'patient_profile', None)
                result.append({
                    'id': str(p.id),
                    'full_name': p.full_name,
                    'email': p.email,
                    'phone_number': p.phone_number,
                    'appointment_count': appt_count,
                    'visited_count': visited_count,
                    'has_visited': visited_count > 0,
                    'has_today_appointment': has_today,
                    'blood_group': profile.blood_group if profile else None,
                    'date_of_birth': profile.date_of_birth if profile else None,
                    'last_appointment': appt.appointment_datetime.isoformat(),
                    'last_status': appt.status,
                })
        return Response(result)


# ── Patient Detail & Visited Appointments for Doctor ──────────────────────────
class DoctorPatientDetailView(APIView):
    """Doctor can view patient profile and all their visited appointment history with full notes."""
    permission_classes = [IsDoctorUser]

    def get(self, request, patient_id):
        doctor = request.user
        patient = get_object_or_404(User, id=patient_id, role=UserRole.PATIENT)
        profile = getattr(patient, 'patient_profile', None)

        appointments = Appointment.objects.filter(
            doctor=doctor,
            patient=patient
        ).select_related(
            'patient', 'doctor', 'doctor__doctor_profile', 'consultation'
        ).prefetch_related('consultation__prescriptions', 'consultation__vitals').order_by('-appointment_datetime')

        emergency_contact = ''
        if profile and profile.emergency_contact_name:
            emergency_contact = f"{profile.emergency_contact_name} ({profile.emergency_contact_relation}): {profile.emergency_contact_phone}".strip()

        return Response({
            'patient': {
                'id': str(patient.id),
                'full_name': patient.full_name,
                'email': patient.email,
                'phone_number': patient.phone_number,
                'blood_group': profile.blood_group if profile else None,
                'date_of_birth': profile.date_of_birth if profile else None,
                'address': profile.address if profile else '',
                'allergies': profile.allergies if profile else '',
                'chronic_conditions': profile.chronic_conditions if profile else '',
                'emergency_contact': emergency_contact,
                'critical_alert': bool(profile.critical_alert) if profile else False,
            },
            'appointments': AppointmentSerializer(appointments, many=True).data,
        })


# ── Patient health records for doctor ────────────────────────────────────────
class PatientConsultationHistoryView(generics.ListAPIView):
    """Doctor can view all consultations for a specific patient."""
    permission_classes = [IsDoctorUser]
    serializer_class = ConsultationNoteSerializer

    def get_queryset(self):
        patient_id = self.kwargs['patient_id']
        doctor = self.request.user
        return ConsultationNote.objects.filter(
            appointment__doctor=doctor,
            appointment__patient_id=patient_id
        ).select_related('appointment', 'vitals').prefetch_related('prescriptions').order_by('-created_at')


# ── Care Messages ViewSet ─────────────────────────────────────────────────────
class CareMessageViewSet(viewsets.ModelViewSet):
    serializer_class = CareMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN:
            qs = CareMessage.objects.all().select_related('sender', 'recipient', 'appointment')
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                qs = qs.filter(models.Q(sender_id=patient_id) | models.Q(recipient_id=patient_id))
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                qs = qs.filter(models.Q(sender_id=doctor_id) | models.Q(recipient_id=doctor_id))
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(models.Q(sender_id=user_id) | models.Q(recipient_id=user_id))
            appointment_id = self.request.query_params.get('appointment_id')
            if appointment_id:
                qs = qs.filter(appointment_id=appointment_id)
            return qs.order_by('created_at')

        qs = CareMessage.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).select_related('sender', 'recipient', 'appointment')

        other_id = self.request.query_params.get('user_id')
        if other_id:
            qs = qs.filter(
                (models.Q(sender=user) & models.Q(recipient_id=other_id)) |
                (models.Q(sender_id=other_id) & models.Q(recipient=user))
            )

        appointment_id = self.request.query_params.get('appointment_id')
        if appointment_id:
            qs = qs.filter(appointment_id=appointment_id)

        return qs.order_by('created_at')

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        try:
            sender = self.request.user
            recipient = message.recipient
            if sender != recipient:
                sender_label = f"Dr. {sender.full_name}" if sender.role == UserRole.DOCTOR else sender.full_name
                preview = (message.content[:75] + "...") if len(message.content) > 75 else message.content
                Notification.objects.create(
                    recipient=recipient,
                    title=f"New message from {sender_label}",
                    message=f"\"{preview}\"",
                    notification_type=NotificationType.CARE_MESSAGE,
                    related_id=str(sender.id),
                )
        except Exception:
            pass

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        sender_id = request.data.get('sender_id')
        if not sender_id:
            return Response({'detail': 'sender_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = CareMessage.objects.filter(
            sender_id=sender_id,
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'marked_read_count': updated})

    @action(detail=False, methods=['get'], url_path='conversations')
    def conversations(self, request):
        user = request.user
        partners = set()
        if user.role == UserRole.PATIENT:
            # doctors from appointments
            doctor_ids = Appointment.objects.filter(patient=user).values_list('doctor_id', flat=True)
            partners.update(doctor_ids)
            # all active registered doctors so patient can start a care conversation with any doctor
            all_doctor_ids = DoctorProfile.objects.filter(user__is_active=True).values_list('user_id', flat=True)
            partners.update(all_doctor_ids)
        elif user.role == UserRole.DOCTOR:
            # patients from appointments
            patient_ids = Appointment.objects.filter(doctor=user).values_list('patient_id', flat=True)
            partners.update(patient_ids)

        # Also add any users exchanged messages with
        sent_to = CareMessage.objects.filter(sender=user).values_list('recipient_id', flat=True)
        rcvd_from = CareMessage.objects.filter(recipient=user).values_list('sender_id', flat=True)
        partners.update(sent_to)
        partners.update(rcvd_from)

        contact_users = User.objects.filter(id__in=partners).select_related('doctor_profile')
        data = []
        for u in contact_users:
            last_msg = CareMessage.objects.filter(
                (models.Q(sender=user) & models.Q(recipient=u)) |
                (models.Q(sender=u) & models.Q(recipient=user))
            ).order_by('-created_at').first()

            unread = CareMessage.objects.filter(sender=u, recipient=user, is_read=False).count()
            dept = getattr(getattr(u, 'doctor_profile', None), 'department', '')

            # Latest appointment between this user and contact if any
            if user.role == UserRole.PATIENT:
                latest_apt = Appointment.objects.filter(patient=user, doctor=u).order_by('-appointment_datetime').first()
            else:
                latest_apt = Appointment.objects.filter(doctor=user, patient=u).order_by('-appointment_datetime').first()

            data.append({
                'user_id': str(u.id),
                'full_name': u.full_name,
                'email': u.email,
                'role': u.role,
                'department': dept,
                'unread_count': unread,
                'last_message': last_msg.content if last_msg else '',
                'last_message_at': last_msg.created_at.isoformat() if last_msg else None,
                'appointment_id': str(latest_apt.id) if latest_apt else None,
            })

        # Sort conversations: active messages first (newest to oldest), then alphabetically by name
        data.sort(key=lambda x: (x['last_message_at'] is not None, x['last_message_at'] or '', x['full_name']), reverse=True)
        return Response(data)


# ── Lab Test ViewSet ──────────────────────────────────────────────────────────
class LabTestViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')
        if user.role == UserRole.PATIENT:
            return LabTest.objects.filter(patient=user).select_related('patient', 'doctor', 'appointment')
        elif user.role == UserRole.DOCTOR:
            if patient_id:
                return LabTest.objects.filter(patient_id=patient_id).select_related('patient', 'doctor', 'appointment')
            return LabTest.objects.filter(doctor=user).select_related('patient', 'doctor', 'appointment')
        qs = LabTest.objects.all().select_related('patient', 'doctor', 'appointment')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.DOCTOR:
            lab = serializer.save(doctor=user)
        elif user.role == UserRole.ADMIN:
            lab = serializer.save()
        else:
            lab = serializer.save(patient=user)

        # Notify patient if ordered by a doctor or hospital admin
        if lab.patient and lab.patient != user:
            try:
                doc_name = f"Dr. {lab.doctor.full_name}" if lab.doctor else "Hospital Clinical Team"
                instr_note = f" Instructions: {lab.instructions}" if lab.instructions else " Check pre-test requirements in your Lab Reports."
                Notification.objects.create(
                    recipient=lab.patient,
                    title=f"New Lab Test Ordered: {lab.test_name}",
                    message=f"{doc_name} ordered a {lab.test_name} ({lab.category}).{instr_note}",
                    notification_type=NotificationType.LAB_RESULT,
                    related_id=str(lab.id),
                )
            except Exception:
                pass

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        old_results = (old_instance.results_summary or '').strip()
        old_notes = (old_instance.doctor_notes or '').strip()
        old_flag = old_instance.abnormal_flag

        updated_lab = serializer.save()

        new_status = updated_lab.status
        new_results = (updated_lab.results_summary or '').strip()
        new_notes = (updated_lab.doctor_notes or '').strip()
        new_flag = updated_lab.abnormal_flag
        patient = updated_lab.patient

        if not patient:
            return

        doc_name = f"Dr. {updated_lab.doctor.full_name}" if updated_lab.doctor else "Doctor"

        # 1. Doctor changed or added clinical notes
        if new_notes and new_notes != old_notes:
            try:
                preview = new_notes if len(new_notes) <= 120 else f"{new_notes[:117]}..."
                Notification.objects.create(
                    recipient=patient,
                    title=f"Clinical Notes Updated: {updated_lab.test_name}",
                    message=f"{doc_name} updated clinical advice on your {updated_lab.test_name}: \"{preview}\"",
                    notification_type=NotificationType.LAB_RESULT,
                    related_id=str(updated_lab.id),
                )
            except Exception:
                pass

        # 2. Critical Alert Flagged
        elif new_flag == 'CRITICAL' and old_flag != 'CRITICAL':
            try:
                Notification.objects.create(
                    recipient=patient,
                    title=f"URGENT: Critical Lab Alert - {updated_lab.test_name}",
                    message=f"Critical findings have been flagged on your {updated_lab.test_name}. Please inspect the report immediately and consult your physician.",
                    notification_type=NotificationType.LAB_RESULT,
                    related_id=str(updated_lab.id),
                )
            except Exception:
                pass

        # 3. Results completed / uploaded / results_summary updated
        elif (new_results and new_results != old_results) or (old_status != new_status and new_status in ['COMPLETED', 'REVIEWED']):
            try:
                Notification.objects.create(
                    recipient=patient,
                    title=f"Lab Results Ready: {updated_lab.test_name}",
                    message=f"Your diagnostic results for {updated_lab.test_name} are now available in your Lab Reports. Status: {updated_lab.get_status_display()}.",
                    notification_type=NotificationType.LAB_RESULT,
                    related_id=str(updated_lab.id),
                )
            except Exception:
                pass

        # 4. Sample Collected status transition
        elif old_status != 'SAMPLE_COLLECTED' and new_status == 'SAMPLE_COLLECTED':
            try:
                Notification.objects.create(
                    recipient=patient,
                    title=f"Sample Collected: {updated_lab.test_name}",
                    message=f"Your sample for {updated_lab.test_name} has been collected and is currently being processed by the laboratory.",
                    notification_type=NotificationType.LAB_RESULT,
                    related_id=str(updated_lab.id),
                )
            except Exception:
                pass


# ── Patient Vitals Log ViewSet ────────────────────────────────────────────────
class PatientVitalsLogViewSet(viewsets.ModelViewSet):
    serializer_class = PatientVitalsLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')
        if user.role == UserRole.PATIENT:
            return PatientVitalsLog.objects.filter(patient=user).select_related('patient')
        elif user.role == UserRole.DOCTOR:
            if patient_id:
                return PatientVitalsLog.objects.filter(patient_id=patient_id).select_related('patient')
            return PatientVitalsLog.objects.none()
        elif user.role == UserRole.ADMIN:
            qs = PatientVitalsLog.objects.all().select_related('patient')
            if patient_id:
                qs = qs.filter(patient_id=patient_id)
            return qs
        return PatientVitalsLog.objects.all().select_related('patient')

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


# ── Prescription ViewSet ──────────────────────────────────────────────────────
class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Prescription.objects.all().select_related(
            'consultation__appointment__patient',
            'consultation__appointment__doctor',
            'consultation__appointment__doctor__doctor_profile'
        ).order_by('-created_at')

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            qs = qs.filter(consultation__appointment__patient_id=patient_id)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            qs = qs.filter(consultation__appointment__doctor_id=doctor_id)

        if user.role == UserRole.PATIENT:
            qs = qs.filter(consultation__appointment__patient=user)
        elif user.role == UserRole.DOCTOR:
            if not patient_id:
                qs = qs.filter(consultation__appointment__doctor=user)

        return qs

    @action(detail=True, methods=['post'], url_path='mark-taken')
    def mark_taken(self, request, pk=None):
        prescription = self.get_object()
        slot = request.data.get('slot', '')
        date_str = request.data.get('date', timezone.now().date().isoformat())
        taken_entry = {'slot': slot, 'date': date_str, 'taken_at': timezone.now().isoformat()}

        dates = prescription.taken_dates or []
        already_taken = any(isinstance(d, dict) and d.get('slot') == slot and d.get('date') == date_str for d in dates)
        if not already_taken:
            dates.append(taken_entry)
            prescription.taken_dates = dates
            prescription.times_taken += 1
            prescription.last_taken_at = timezone.now()
            prescription.save(update_fields=['taken_dates', 'times_taken', 'last_taken_at'])

        return Response({
            'status': 'success',
            'prescription_id': str(prescription.id),
            'times_taken': prescription.times_taken,
            'last_taken_at': prescription.last_taken_at,
            'taken_dates': prescription.taken_dates,
        })

    @action(detail=True, methods=['post'], url_path='unmark-taken')
    def unmark_taken(self, request, pk=None):
        prescription = self.get_object()
        slot = request.data.get('slot', '')
        date_str = request.data.get('date', timezone.now().date().isoformat())
        dates = prescription.taken_dates or []
        new_dates = [d for d in dates if not (isinstance(d, dict) and d.get('slot') == slot and d.get('date') == date_str)]
        if len(new_dates) < len(dates):
            prescription.taken_dates = new_dates
            prescription.times_taken = max(0, prescription.times_taken - 1)
            prescription.save(update_fields=['taken_dates', 'times_taken'])

        return Response({
            'status': 'success',
            'times_taken': prescription.times_taken,
            'taken_dates': prescription.taken_dates,
        })


# ── Prescription Refill ViewSet ───────────────────────────────────────────────
class PrescriptionRefillViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionRefillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return PrescriptionRefill.objects.filter(patient=user).select_related(
                'prescription', 'prescription__consultation', 'doctor', 'patient'
            )
        elif user.role == UserRole.DOCTOR:
            return PrescriptionRefill.objects.filter(doctor=user).select_related(
                'prescription', 'prescription__consultation', 'doctor', 'patient'
            )
        return PrescriptionRefill.objects.all()

    def perform_create(self, serializer):
        prescription = serializer.validated_data['prescription']
        doctor = prescription.consultation.appointment.doctor
        serializer.save(patient=self.request.user, doctor=doctor)

    @action(detail=True, methods=['patch', 'post'], url_path='decide', permission_classes=[IsDoctorUser])
    def decide(self, request, pk=None):
        refill = self.get_object()
        decision = request.data.get('decision') # APPROVED or REJECTED
        notes = request.data.get('doctor_response', '')
        if decision not in [RefillStatus.APPROVED, RefillStatus.REJECTED]:
            return Response({'detail': "Decision must be 'APPROVED' or 'REJECTED'."}, status=status.HTTP_400_BAD_REQUEST)

        refill.status = decision
        refill.doctor_response = notes
        refill.save()
        return Response(PrescriptionRefillSerializer(refill).data)


# ── Notifications ViewSet ─────────────────────────────────────────────────────
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        check_and_update_no_show_appointments()
        check_and_create_30min_reminders()
        self.ensure_welcome_notification(user)
        self.sync_admin_broadcasts(user)
        return Notification.objects.filter(recipient=user).order_by('-created_at')

    def ensure_welcome_notification(self, user):
        if not Notification.objects.filter(recipient=user, notification_type=NotificationType.WELCOME).exists():
            Notification.objects.create(
                recipient=user,
                title="Welcome to MediFlow!",
                message=f"Hello {user.full_name or 'there'}, welcome to your MediFlow Patient Portal! Here you can book appointments, review clinical notes, manage daily prescriptions, and stay in direct touch with your care team.",
                notification_type=NotificationType.WELCOME,
            )

    def check_30min_reminders(self, user):
        now = timezone.now()
        in_30_mins = now + timedelta(minutes=30)
        upcoming_appts = Appointment.objects.filter(
            Q(patient=user) | Q(doctor=user),
            status=AppointmentStatus.SCHEDULED,
            appointment_datetime__gte=now,
            appointment_datetime__lte=in_30_mins,
        ).select_related('doctor', 'patient')

        for apt in upcoming_appts:
            if not Notification.objects.filter(recipient=user, notification_type=NotificationType.APPOINTMENT_REMINDER, related_id=str(apt.id)).exists():
                is_patient = (user == apt.patient)
                other_name = f"Dr. {apt.doctor.full_name}" if is_patient else apt.patient.full_name
                dt_str = timezone.localtime(apt.appointment_datetime).strftime('%I:%M %p')
                Notification.objects.create(
                    recipient=user,
                    title="Upcoming Appointment Reminder",
                    message=f"Reminder: You have an appointment with {other_name} starting at {dt_str} (in less than 30 minutes)!",
                    notification_type=NotificationType.APPOINTMENT_REMINDER,
                    related_id=str(apt.id),
                )

    def sync_admin_broadcasts(self, user):
        from accounts.models import HospitalBroadcast
        active_broadcasts = HospitalBroadcast.objects.filter(is_active=True)
        if user.role == UserRole.PATIENT:
            active_broadcasts = active_broadcasts.filter(target_audience__in=['ALL', 'PATIENT'])
        elif user.role == UserRole.DOCTOR:
            active_broadcasts = active_broadcasts.filter(target_audience__in=['ALL', 'DOCTOR'])
        active_broadcasts = active_broadcasts.order_by('-created_at')[:10]
        for b in active_broadcasts:
            if not Notification.objects.filter(recipient=user, notification_type=NotificationType.ADMIN_BROADCAST, related_id=str(b.id)).exists():
                Notification.objects.create(
                    recipient=user,
                    title=f"Hospital Notice: {b.title}",
                    message=b.message,
                    notification_type=NotificationType.ADMIN_BROADCAST,
                    related_id=str(b.id),
                )

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = request.user
        check_and_update_no_show_appointments()
        check_and_create_30min_reminders()
        self.ensure_welcome_notification(user)
        self.sync_admin_broadcasts(user)
        count = Notification.objects.filter(recipient=user, is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'marked_read': updated})

    @action(detail=True, methods=['patch', 'post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


# ── Doctor Reviews ViewSet ────────────────────────────────────────────────────
class DoctorReviewViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DoctorReview.objects.all().select_related('patient', 'doctor', 'appointment')

        # If a doctor is accessing reviews, default to reviews received by this doctor
        if getattr(user, 'role', None) == UserRole.DOCTOR:
            qs = qs.filter(doctor=user)
        else:
            doctor_id = self.request.query_params.get('doctor')
            if doctor_id and doctor_id != 'undefined' and doctor_id != 'null':
                try:
                    import uuid
                    val_uuid = uuid.UUID(str(doctor_id))
                    qs = qs.filter(Q(doctor_id=val_uuid) | Q(doctor__doctor_profile__id=val_uuid))
                except (ValueError, TypeError):
                    try:
                        int_id = int(doctor_id)
                        qs = qs.filter(doctor__doctor_profile__id=int_id)
                    except (ValueError, TypeError):
                        pass

        patient_id = self.request.query_params.get('patient')
        if patient_id and patient_id != 'undefined' and patient_id != 'null':
            try:
                import uuid
                val_uuid = uuid.UUID(str(patient_id))
                qs = qs.filter(patient_id=val_uuid)
            except (ValueError, TypeError):
                pass

        appointment_id = self.request.query_params.get('appointment')
        if appointment_id and appointment_id != 'undefined' and appointment_id != 'null':
            try:
                import uuid
                val_uuid = uuid.UUID(str(appointment_id))
                qs = qs.filter(appointment_id=val_uuid)
            except (ValueError, TypeError):
                pass

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        appointment = serializer.validated_data.get('appointment')
        existing = DoctorReview.objects.filter(appointment=appointment).first()
        if existing:
            existing.rating = serializer.validated_data.get('rating', existing.rating)
            existing.comment = serializer.validated_data.get('comment', existing.comment)
            existing.save()
            serializer.instance = existing
            return
        serializer.save(patient=self.request.user, doctor=appointment.doctor)
