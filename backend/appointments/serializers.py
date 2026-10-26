from datetime import datetime
from rest_framework import serializers
from .models import (
    PatientProfile, DoctorProfile, DoctorSchedule, DoctorLeave,
    Appointment, ConsultationNote, VitalSigns, Prescription,
    CareMessage, LabTest, PatientVitalsLog, PrescriptionRefill
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

    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'department', 'consultation_fee', 'bio', 'license_number', 'years_experience', 'updated_at']
        read_only_fields = ['id', 'user', 'updated_at']


# ── Doctor Schedule ───────────────────────────────────────────────────────────
class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ['id', 'doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active']
        read_only_fields = ['doctor']

    def validate(self, attrs):
        start_time = attrs.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time') or (self.instance.end_time if self.instance else None)
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

        if doctor and day_of_week is not None and start_time and end_time:
            existing = DoctorSchedule.objects.filter(
                doctor=doctor,
                day_of_week=day_of_week,
                is_active=True,
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            for s in existing:
                # Interval collision check: start < s.end and end > s.start
                if start_time < s.end_time and end_time > s.start_time:
                    day_name = dict(DoctorSchedule.DAY_CHOICES).get(day_of_week, 'this day')
                    s_start = s.start_time.strftime('%H:%M')
                    s_end = s.end_time.strftime('%H:%M')
                    raise serializers.ValidationError({
                        "detail": f"Time slot collides with an existing schedule ({s_start} – {s_end}) on {day_name}."
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

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'doctor',
            'patient_details', 'doctor_details', 'doctor_profile',
            'appointment_datetime', 'duration_minutes', 'status',
            'reason_for_visit', 'consultation', 'created_at',
        ]
        read_only_fields = ['patient', 'status', 'created_at', 'consultation']

    def get_doctor_profile(self, obj):
        try:
            return {
                'department': obj.doctor.doctor_profile.department,
                'consultation_fee': str(obj.doctor.doctor_profile.consultation_fee),
            }
        except Exception:
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
