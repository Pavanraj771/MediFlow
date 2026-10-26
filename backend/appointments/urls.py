from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PatientProfileView,
    DoctorProfileListView,
    DoctorProfileMeView,
    DoctorScheduleViewSet,
    DoctorLeaveViewSet,
    AvailableSlotsView,
    AppointmentViewSet,
    DoctorPatientListView,
    PatientConsultationHistoryView,
    CareMessageViewSet,
    LabTestViewSet,
    PatientVitalsLogViewSet,
    PrescriptionRefillViewSet,
)

router = DefaultRouter()
router.register(r'messages', CareMessageViewSet, basename='message')
router.register(r'lab-tests', LabTestViewSet, basename='lab-test')
router.register(r'vitals-logs', PatientVitalsLogViewSet, basename='vitals-log')
router.register(r'refills', PrescriptionRefillViewSet, basename='refill')
router.register(r'schedules', DoctorScheduleViewSet, basename='schedule')
router.register(r'leaves', DoctorLeaveViewSet, basename='leave')
router.register(r'', AppointmentViewSet, basename='appointment')

urlpatterns = [
    # Patient
    path('patient-profile/', PatientProfileView.as_view(), name='patient-profile'),

    # Doctors
    path('doctors/', DoctorProfileListView.as_view(), name='doctor-list'),
    path('doctors/me/', DoctorProfileMeView.as_view(), name='doctor-profile-me'),
    path('doctors/<uuid:doctor_id>/slots/', AvailableSlotsView.as_view(), name='doctor-slots'),

    # Doctor portal — patient list & history
    path('my-patients/', DoctorPatientListView.as_view(), name='doctor-patient-list'),
    path('my-patients/<uuid:patient_id>/consultations/', PatientConsultationHistoryView.as_view(), name='patient-consultations'),

    # Router (appointments + schedules + leaves)
    path('', include(router.urls)),
]
