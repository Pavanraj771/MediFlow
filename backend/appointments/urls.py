from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorProfileListView,
    DoctorScheduleViewSet,
    DoctorLeaveViewSet,
    AvailableSlotsView,
    AppointmentViewSet
)

router = DefaultRouter()
router.register(r'schedules', DoctorScheduleViewSet, basename='schedule')
router.register(r'leaves', DoctorLeaveViewSet, basename='leave')
router.register(r'', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('doctors/', DoctorProfileListView.as_view(), name='doctor-list'),
    path('doctors/<uuid:doctor_id>/slots/', AvailableSlotsView.as_view(), name='doctor-slots'),
    path('', include(router.urls)),
]
