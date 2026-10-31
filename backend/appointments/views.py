from datetime import datetime, timedelta
from django.utils import timezone
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


# ── Appointments ──────────────────────────────────────────────────────────────
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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
        serializer.save(sender=self.request.user)

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
        # Find all doctors or patients this user has interacted with or has appointments with
        partners = set()
        if user.role == UserRole.PATIENT:
            # doctors from appointments
            doctor_ids = Appointment.objects.filter(patient=user).values_list('doctor_id', flat=True)
            partners.update(doctor_ids)
        elif user.role == UserRole.DOCTOR:
            # patients from appointments
            patient_ids = Appointment.objects.filter(doctor=user).values_list('patient_id', flat=True)
            partners.update(patient_ids)

        # Also add any users exchanged messages with
        sent_to = CareMessage.objects.filter(sender=user).values_list('recipient_id', flat=True)
        rcvd_from = CareMessage.objects.filter(recipient=user).values_list('sender_id', flat=True)
        partners.update(sent_to)
        partners.update(rcvd_from)

        contact_users = User.objects.filter(id__in=partners)
        data = []
        for u in contact_users:
            last_msg = CareMessage.objects.filter(
                (models.Q(sender=user) & models.Q(recipient=u)) |
                (models.Q(sender=u) & models.Q(recipient=user))
            ).order_by('-created_at').first()

            unread = CareMessage.objects.filter(sender=u, recipient=user, is_read=False).count()
            dept = getattr(getattr(u, 'doctor_profile', None), 'department', '')

            data.append({
                'user_id': str(u.id),
                'full_name': u.full_name,
                'email': u.email,
                'role': u.role,
                'department': dept,
                'unread_count': unread,
                'last_message': last_msg.content if last_msg else '',
                'last_message_at': last_msg.created_at.isoformat() if last_msg else None,
            })

        # Sort conversations by most recent message
        data.sort(key=lambda x: x['last_message_at'] or '', reverse=True)
        return Response(data)


# ── Lab Test ViewSet ──────────────────────────────────────────────────────────
class LabTestViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return LabTest.objects.filter(patient=user).select_related('patient', 'doctor', 'appointment')
        elif user.role == UserRole.DOCTOR:
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return LabTest.objects.filter(patient_id=patient_id).select_related('patient', 'doctor', 'appointment')
            return LabTest.objects.filter(doctor=user).select_related('patient', 'doctor', 'appointment')
        return LabTest.objects.all().select_related('patient', 'doctor', 'appointment')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == UserRole.DOCTOR:
            serializer.save(doctor=user)
        else:
            serializer.save(patient=user)


# ── Patient Vitals Log ViewSet ────────────────────────────────────────────────
class PatientVitalsLogViewSet(viewsets.ModelViewSet):
    serializer_class = PatientVitalsLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.PATIENT:
            return PatientVitalsLog.objects.filter(patient=user).select_related('patient')
        elif user.role == UserRole.DOCTOR:
            patient_id = self.request.query_params.get('patient_id')
            if patient_id:
                return PatientVitalsLog.objects.filter(patient_id=patient_id).select_related('patient')
            return PatientVitalsLog.objects.none()
        return PatientVitalsLog.objects.all().select_related('patient')

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


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
        self.ensure_welcome_notification(user)
        self.check_30min_reminders(user)
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
        active_broadcasts = HospitalBroadcast.objects.filter(is_active=True).order_by('-created_at')[:10]
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
        self.ensure_welcome_notification(user)
        self.check_30min_reminders(user)
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
