import uuid
from django.db import models
from django.conf import settings

class Department(models.TextChoices):
    CARDIOLOGY = "CARDIOLOGY", "Cardiology"
    NEUROLOGY = "NEUROLOGY", "Neurology"
    GENERAL_MEDICINE = "GENERAL_MEDICINE", "General Medicine"
    ORTHOPEDICS = "ORTHOPEDICS", "Orthopedics"
    PEDIATRICS = "PEDIATRICS", "Pediatrics"

class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    department = models.CharField(max_length=50, choices=Department.choices, default=Department.GENERAL_MEDICINE)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"Dr. {self.user.full_name} - {self.get_department_display()}"

class DoctorSchedule(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('doctor', 'day_of_week')

class DoctorLeave(models.Model):
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leaves')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)

class AppointmentStatus(models.TextChoices):
    SCHEDULED = "SCHEDULED", "Scheduled"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"
    NO_SHOW = "NO_SHOW", "No-Show"

class Appointment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_appointments')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    appointment_datetime = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED)
    reason_for_visit = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'appointment_datetime'],
                condition=models.Q(status='SCHEDULED'),
                name='unique_doctor_appointment_time'
            )
        ]

    def __str__(self):
        return f"Appointment: {self.patient.full_name} with Dr. {self.doctor.full_name} on {self.appointment_datetime}"
