from datetime import datetime
from django.db.models import Avg
from rest_framework import serializers
from .models import (
    PatientProfile, DoctorProfile, DoctorSchedule, DoctorLeave,
    Appointment, AppointmentStatus, ConsultationNote, VitalSigns, Prescription,
    CareMessage, LabTest, PatientVitalsLog, PrescriptionRefill,
    Notification, DoctorReview
)
from accounts.serializers import UserSerializer


# ── Patient Profile ───────────────────────────────────────────────────────────
class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'user', 'blood_group', 'date_of_birth', 'gender', 'address',
            'allergies', 'chronic_conditions',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relation', 'critical_alert', 'organ_donor', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'updated_at']


# ── Doctor Profile ────────────────────────────────────────────────────────────
class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    recent_reviews = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'user', 'department', 'consultation_fee', 'bio',
            'license_number', 'years_experience', 'updated_at',
            'average_rating', 'review_count', 'recent_reviews'
        ]
        read_only_fields = ['id', 'user', 'updated_at']

    def get_average_rating(self, obj):
        try:
            avg = obj.user.doctor_reviews_received.aggregate(Avg('rating'))['rating__avg']
            return round(float(avg), 1) if avg is not None else None
        except Exception:
            return None

    def get_review_count(self, obj):
        try:
            return obj.user.doctor_reviews_received.count()
        except Exception:
            return 0

    def get_recent_reviews(self, obj):
        try:
            reviews = obj.user.doctor_reviews_received.all()[:5]
            return [
                {
                    'id': str(r.id),
                    'patient_name': r.patient.full_name or 'Patient',
                    'rating': r.rating,
                    'comment': r.comment,
                    'created_at': r.created_at.isoformat(),
                }
                for r in reviews
            ]
        except Exception:
            return []


# ── Doctor Schedule ───────────────────────────────────────────────────────────
class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = ['id', 'doctor', 'date', 'day_of_week', 'day_name', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active']
        read_only_fields = ['doctor']
        extra_kwargs = {
            'day_of_week': {'required': False}
        }

    def validate(self, attrs):
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time') or (self.instance.end_time if self.instance else None)
        date = attrs.get('date') or (self.instance.date if self.instance else None)
        if date and ('day_of_week' not in attrs or attrs.get('day_of_week') is None):
            attrs['day_of_week'] = date.weekday()
        day_of_week = attrs.get('day_of_week') if 'day_of_week' in attrs else (self.instance.day_of_week if self.instance else None)
        slot_duration = attrs.get('slot_duration_minutes') or (self.instance.slot_duration_minutes if self.instance else 30)

        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError({"detail": "Start time must be strictly earlier than end time."})

            start_dt = datetime.combine(datetime.today(), start_time)
            end_dt = datetime.combine(datetime.today(), end_time)
            total_minutes = int((end_dt - start_dt).total_seconds() / 60)
            if total_minutes < slot_duration:
                raise serializers.ValidationError({
                    "detail": f"Slot duration ({slot_duration} mins) exceeds total shift duration ({total_minutes} mins)."
                })

        request = self.context.get('request')
        doctor = getattr(request, 'user', None) or (self.instance.doctor if self.instance else None)

        if doctor and start_time and end_time:
            from django.db.models import Q
            existing = DoctorSchedule.objects.filter(
                doctor=doctor,
                is_active=True,
            )
            if date:
                existing = existing.filter(Q(date=date) | (Q(date__isnull=True) & Q(day_of_week=day_of_week)))
            elif day_of_week is not None:
                existing = existing.filter(day_of_week=day_of_week)

            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            for s in existing:
                # Interval collision check: start < s.end and end > s.start
                if start_time < s.end_time and end_time > s.start_time:
                    label = s.date.strftime('%Y-%m-%d') if s.date else dict(DoctorSchedule.DAY_CHOICES).get(day_of_week, 'this day')
                    s_start = s.start_time.strftime('%H:%M')
                    s_end = s.end_time.strftime('%H:%M')
                    raise serializers.ValidationError({
                        "detail": f"Time slot collides with an existing schedule ({s_start} – {s_end}) on {label}."
                    })

        return attrs


# ── Doctor Leave ──────────────────────────────────────────────────────────────
class DoctorLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorLeave
        fields = ['id', 'doctor', 'start_datetime', 'end_datetime', 'reason']
        read_only_fields = ['doctor']


# ── Prescription ──────────────────────────────────────────────────────────────
class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['id', 'medication_name', 'dosage', 'frequency', 'duration', 'instructions', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        freq = data.get('frequency')
        if isinstance(freq, list):
            data['frequency'] = ', '.join([str(item).strip() for item in freq if str(item).strip()])
        if 'duration' in data and data['duration'] is not None:
            data['duration'] = str(data['duration']).strip()
        return super().to_internal_value(data)


# ── Vital Signs ───────────────────────────────────────────────────────────────
class VitalSignsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSigns
        fields = [
            'id', 'blood_pressure_systolic', 'blood_pressure_diastolic',
            'pulse_rate', 'temperature', 'weight_kg', 'height_cm', 'oxygen_saturation',
        ]


# ── Consultation Note ─────────────────────────────────────────────────────────
class ConsultationNoteSerializer(serializers.ModelSerializer):
    prescriptions = PrescriptionSerializer(many=True, required=False)
    vitals = VitalSignsSerializer(required=False, allow_null=True)

    class Meta:
        model = ConsultationNote
        fields = [
            'id', 'appointment', 'symptoms', 'diagnosis', 'notes',
            'follow_up_date', 'vitals', 'prescriptions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'appointment', 'created_at', 'updated_at']

    def create(self, validated_data):
        prescriptions_data = validated_data.pop('prescriptions', [])
        vitals_data = validated_data.pop('vitals', None)
        consultation = ConsultationNote.objects.create(**validated_data)
        if vitals_data:
            VitalSigns.objects.create(consultation=consultation, **vitals_data)
        for presc in prescriptions_data:
            Prescription.objects.create(consultation=consultation, **presc)
        return consultation

    def update(self, instance, validated_data):
        prescriptions_data = validated_data.pop('prescriptions', None)
        vitals_data = validated_data.pop('vitals', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if vitals_data is not None:
            VitalSigns.objects.update_or_create(
                consultation=instance, defaults=vitals_data
            )

        if prescriptions_data is not None:
            instance.prescriptions.all().delete()
            for presc in prescriptions_data:
                Prescription.objects.create(consultation=instance, **presc)

        return instance


# ── Appointment (full) ────────────────────────────────────────────────────────
class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)
    doctor_details = UserSerializer(source='doctor', read_only=True)
    consultation = ConsultationNoteSerializer(read_only=True)
    doctor_profile = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor',
            'patient_details', 'doctor_details', 'doctor_profile',
            'appointment_datetime', 'duration_minutes', 'status',
            'reason_for_visit', 'cancellation_reason', 'cancelled_by_role',
            'consultation', 'review', 'created_at',
        ]
        read_only_fields = ['patient', 'status', 'created_at', 'consultation', 'review', 'cancellation_reason', 'cancelled_by_role']

    def get_doctor_profile(self, obj):
        try:
            return {
                'department': obj.doctor.doctor_profile.department,
                'consultation_fee': str(obj.doctor.doctor_profile.consultation_fee),
            }
        except Exception:
            return None

    def get_review(self, obj):
        try:
            r = getattr(obj, 'review', None)
            if r:
                return {
                    'id': str(r.id),
                    'rating': r.rating,
                    'comment': r.comment,
                    'created_at': r.created_at.isoformat(),
                }
        except Exception:
            pass
        return None


# ── Care Message Serializer ───────────────────────────────────────────────────
class CareMessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source='sender', read_only=True)
    recipient_details = UserSerializer(source='recipient', read_only=True)

    class Meta:
        model = CareMessage
        fields = [
            'id', 'sender', 'sender_details', 'recipient', 'recipient_details',
            'appointment', 'subject', 'content', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'sender', 'sender_details', 'recipient_details', 'created_at']


# ── Lab Test Serializer ───────────────────────────────────────────────────────
class LabTestSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)
    doctor_details = UserSerializer(source='doctor', read_only=True)

    class Meta:
        model = LabTest
        fields = [
            'id', 'patient', 'patient_details', 'doctor', 'doctor_details',
            'appointment', 'test_name', 'category', 'status', 'abnormal_flag',
            'instructions', 'results_summary', 'file_name', 'doctor_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'patient_details', 'doctor_details', 'created_at', 'updated_at']


# ── Patient Vitals Log Serializer ─────────────────────────────────────────────
class PatientVitalsLogSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)

    class Meta:
        model = PatientVitalsLog
        fields = [
            'id', 'patient', 'patient_details', 'recorded_at',
            'blood_pressure_systolic', 'blood_pressure_diastolic',
            'blood_sugar', 'pulse_rate', 'weight_kg',
            'oxygen_saturation', 'temperature', 'notes',
        ]
        read_only_fields = ['id', 'patient', 'patient_details', 'recorded_at']


# ── Prescription Refill Serializer ────────────────────────────────────────────
class PrescriptionRefillSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)
    doctor_details = UserSerializer(source='doctor', read_only=True)
    prescription_details = PrescriptionSerializer(source='prescription', read_only=True)

    class Meta:
        model = PrescriptionRefill
        fields = [
            'id', 'prescription', 'prescription_details', 'patient', 'patient_details',
            'doctor', 'doctor_details', 'status', 'patient_notes', 'doctor_response',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'patient_details', 'doctor', 'doctor_details', 'prescription_details', 'created_at', 'updated_at']


# ── Notification Serializer ───────────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'related_id', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ── Doctor Review Serializer ──────────────────────────────────────────────────
class DoctorReviewSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(),
        required=False
    )
    appointment_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = DoctorReview
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'appointment', 'appointment_id', 'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'patient', 'doctor', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        appointment = attrs.get('appointment')
        appointment_id = attrs.pop('appointment_id', None)
        if not appointment and appointment_id:
            try:
                appointment = Appointment.objects.get(id=appointment_id)
                attrs['appointment'] = appointment
            except Appointment.DoesNotExist:
                raise serializers.ValidationError({"appointment": "Appointment not found."})

        if not appointment and self.instance:
            appointment = self.instance.appointment

        if not appointment:
            raise serializers.ValidationError({"appointment": "Appointment is required."})

        if appointment.status != AppointmentStatus.COMPLETED:
            raise serializers.ValidationError("Reviews can only be submitted for completed appointments.")
        if request and appointment.patient != request.user:
            raise serializers.ValidationError("You can only review your own appointments.")
        attrs['doctor'] = appointment.doctor
        return attrs
