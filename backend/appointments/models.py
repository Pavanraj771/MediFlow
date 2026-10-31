import uuid
from django.db import models
from django.conf import settings

class Department(models.TextChoices):
    CARDIOLOGY = "CARDIOLOGY", "Cardiology"
    NEUROLOGY = "NEUROLOGY", "Neurology"
    GENERAL_MEDICINE = "GENERAL_MEDICINE", "General Medicine"
    ORTHOPEDICS = "ORTHOPEDICS", "Orthopedics"
    PEDIATRICS = "PEDIATRICS", "Pediatrics"

class BloodGroup(models.TextChoices):
    A_POS = "A+", "A+"
    A_NEG = "A-", "A-"
    B_POS = "B+", "B+"
    B_NEG = "B-", "B-"
    AB_POS = "AB+", "AB+"
    AB_NEG = "AB-", "AB-"
    O_POS = "O+", "O+"
    O_NEG = "O-", "O-"
    UNKNOWN = "UNKNOWN", "Unknown"

# ── Patient Extended Profile ──────────────────────────────────────────────────
class PatientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile'
    )
    blood_group = models.CharField(
        max_length=10, choices=BloodGroup.choices, default=BloodGroup.UNKNOWN
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')],
        blank=True, default=''
    )
    address = models.TextField(blank=True, default='')
    allergies = models.TextField(blank=True, default='', help_text='Comma-separated list of allergies')
    chronic_conditions = models.TextField(blank=True, default='', help_text='Known chronic conditions')
    emergency_contact_name = models.CharField(max_length=150, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=30, blank=True, default='')
    emergency_contact_relation = models.CharField(max_length=50, blank=True, default='')
    critical_alert = models.TextField(blank=True, default='', help_text='Doctor or patient flagged critical alerts e.g. severe drug allergies, pacemaker')
    organ_donor = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.full_name}"

# ── Doctor Profile ────────────────────────────────────────────────────────────
class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    department = models.CharField(max_length=50, choices=Department.choices, default=Department.GENERAL_MEDICINE)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    bio = models.TextField(blank=True, default='')
    license_number = models.CharField(max_length=100, blank=True, default='')
    years_experience = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dr. {self.user.full_name} - {self.get_department_display()}"

# ── Doctor Schedule ───────────────────────────────────────────────────────────
class DoctorSchedule(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField(null=True, blank=True)
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'day_of_week', 'start_time']

    def save(self, *args, **kwargs):
        if self.date is not None and self.day_of_week is None:
            self.day_of_week = self.date.weekday()
        super().save(*args, **kwargs)

# ── Doctor Leave ──────────────────────────────────────────────────────────────
class DoctorLeave(models.Model):
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leaves')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True)

# ── Appointment ───────────────────────────────────────────────────────────────
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
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_by_role = models.CharField(max_length=20, blank=True, default='')
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

# ── Consultation Note ─────────────────────────────────────────────────────────
class ConsultationNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='consultation')
    symptoms = models.TextField(blank=True, default='')
    diagnosis = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='', help_text="Doctor's additional notes and instructions")
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Consultation for {self.appointment}"

# ── Vital Signs ───────────────────────────────────────────────────────────────
class VitalSigns(models.Model):
    consultation = models.OneToOneField(ConsultationNote, on_delete=models.CASCADE, related_name='vitals')
    blood_pressure_systolic = models.PositiveIntegerField(null=True, blank=True, help_text='mmHg')
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True, help_text='mmHg')
    pulse_rate = models.PositiveIntegerField(null=True, blank=True, help_text='bpm')
    temperature = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='°F')
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    oxygen_saturation = models.PositiveIntegerField(null=True, blank=True, help_text='SpO2 %')

    def __str__(self):
        return f"Vitals for {self.consultation}"

# ── Prescription ──────────────────────────────────────────────────────────────
class Prescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultation = models.ForeignKey(ConsultationNote, on_delete=models.CASCADE, related_name='prescriptions')
    medication_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100, blank=True, default='', help_text='e.g. 500mg')
    frequency = models.CharField(max_length=100, blank=True, default='', help_text='e.g. Twice daily')
    duration = models.CharField(max_length=100, blank=True, default='', help_text='e.g. 7 days')
    instructions = models.TextField(blank=True, default='', help_text='Special instructions, e.g. take with food')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medication_name} for {self.consultation}"


# ── Care Message (Doctor-Patient Secure Messaging) ────────────────────────────
class CareMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='care_messages')
    subject = models.CharField(max_length=200, blank=True, default='')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.full_name} to {self.recipient.full_name} at {self.created_at}"


# ── Lab & Diagnostic Test ─────────────────────────────────────────────────────
class LabTestCategory(models.TextChoices):
    BLOOD = "BLOOD", "Blood Test"
    IMAGING = "IMAGING", "Radiology / Imaging"
    URINE = "URINE", "Urinalysis"
    PATHOLOGY = "PATHOLOGY", "Pathology / Biopsy"
    CARDIAC = "CARDIAC", "Cardiac Diagnostic"
    OTHER = "OTHER", "Other Diagnostic"

class LabTestStatus(models.TextChoices):
    ORDERED = "ORDERED", "Ordered"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED", "Sample Collected"
    COMPLETED = "COMPLETED", "Completed / Results Ready"
    REVIEWED = "REVIEWED", "Doctor Reviewed"

class AbnormalFlag(models.TextChoices):
    NORMAL = "NORMAL", "Normal"
    HIGH = "HIGH", "High"
    LOW = "LOW", "Low"
    CRITICAL = "CRITICAL", "Critical Alert"

class LabTest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_lab_tests')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctor_lab_tests')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_tests')
    test_name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=LabTestCategory.choices, default=LabTestCategory.BLOOD)
    status = models.CharField(max_length=30, choices=LabTestStatus.choices, default=LabTestStatus.ORDERED)
    abnormal_flag = models.CharField(max_length=20, choices=AbnormalFlag.choices, default=AbnormalFlag.NORMAL)
    instructions = models.TextField(blank=True, default='', help_text='Pre-test requirements e.g. 12hr fasting')
    results_summary = models.TextField(blank=True, default='', help_text='Test results and metrics')
    file_name = models.CharField(max_length=255, blank=True, default='', help_text='Document or report filename')
    doctor_notes = models.TextField(blank=True, default='', help_text='Doctor clinical interpretation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.test_name} for {self.patient.full_name} ({self.status})"


# ── Patient Home Vitals Log (Self-Monitoring) ─────────────────────────────────
class PatientVitalsLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='home_vitals_logs')
    recorded_at = models.DateTimeField(auto_now_add=True)
    blood_pressure_systolic = models.PositiveIntegerField(null=True, blank=True, help_text='mmHg')
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True, help_text='mmHg')
    blood_sugar = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True, help_text='mg/dL')
    pulse_rate = models.PositiveIntegerField(null=True, blank=True, help_text='bpm')
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    oxygen_saturation = models.PositiveIntegerField(null=True, blank=True, help_text='SpO2 %')
    temperature = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='°F')
    notes = models.CharField(max_length=255, blank=True, default='', help_text='e.g. Fasting, post-workout, felt dizzy')

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Vitals log for {self.patient.full_name} at {self.recorded_at}"


# ── Prescription Refill Request ───────────────────────────────────────────────
class RefillStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"

class PrescriptionRefill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='refill_requests')
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_refills')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_refills')
    status = models.CharField(max_length=20, choices=RefillStatus.choices, default=RefillStatus.PENDING)
    patient_notes = models.TextField(blank=True, default='', help_text='Reason for refill / days remaining')
    doctor_response = models.TextField(blank=True, default='', help_text='Physician notes or approval instructions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Refill for {self.prescription.medication_name} ({self.status})"


# ── Notification ──────────────────────────────────────────────────────────────
class NotificationType(models.TextChoices):
    WELCOME = "WELCOME", "Welcome Message"
    APPOINTMENT_SCHEDULED = "APPOINTMENT_SCHEDULED", "Appointment Scheduled"
    APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED", "Appointment Cancelled"
    APPOINTMENT_COMPLETED = "APPOINTMENT_COMPLETED", "Appointment Completed"
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER", "30-Min Reminder"
    ADMIN_BROADCAST = "ADMIN_BROADCAST", "Admin Announcement"
    GENERAL = "GENERAL", "General Notification"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.GENERAL)
    related_id = models.CharField(max_length=100, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} to {self.recipient.email}"


# ── Doctor Review & Rating ───────────────────────────────────────────────────
class DoctorReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_reviews_given')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_reviews_received')
    appointment = models.OneToOneField('Appointment', on_delete=models.CASCADE, related_name='review')
    rating = models.PositiveSmallIntegerField(help_text='Rating from 1 to 5')
    comment = models.TextField(blank=True, default='', help_text='Patient review comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for Dr. {self.doctor.full_name} by {self.patient.full_name}: {self.rating} stars"
