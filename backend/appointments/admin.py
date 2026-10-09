from django.contrib import admin
from .models import DoctorProfile, DoctorSchedule, DoctorLeave, Appointment

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'consultation_fee')
    search_fields = ('user__first_name', 'user__last_name', 'department')

@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time', 'is_active')
    list_filter = ('day_of_week', 'is_active', 'doctor')

@admin.register(DoctorLeave)
class DoctorLeaveAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'start_datetime', 'end_datetime', 'reason')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'appointment_datetime', 'status')
    list_filter = ('status', 'appointment_datetime', 'doctor')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__first_name')
