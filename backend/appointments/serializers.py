from rest_framework import serializers
from .models import DoctorProfile, DoctorSchedule, DoctorLeave, Appointment
from accounts.serializers import UserSerializer

class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'department', 'consultation_fee']

class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ['id', 'doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'is_active']
        read_only_fields = ['doctor']

class DoctorLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorLeave
        fields = ['id', 'doctor', 'start_datetime', 'end_datetime', 'reason']
        read_only_fields = ['doctor']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = UserSerializer(source='patient', read_only=True)
    doctor_details = UserSerializer(source='doctor', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'patient_details', 'doctor_details', 'appointment_datetime', 'duration_minutes', 'status', 'reason_for_visit', 'created_at']
        read_only_fields = ['patient', 'status', 'created_at']
