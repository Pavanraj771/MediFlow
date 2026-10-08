from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        "system": "MediFlow Hospital Management Platform",
        "version": "1.0.0",
        "status": "online",
        "modules": {
            "module_1": "Authentication, Identity & Role-Based Access Control (RBAC)",
            "module_2": "Dynamic Doctor Scheduling & Appointment Management",
            "module_3": "Electronic Medical Records (EMR) & Clinical Consultation Cockpit",
            "module_4": "Explainable AI (XAI) & Clinical Decision Support System (CDSS)",
            "module_5": "Hospital Administration, Department Operations & Analytics",
            "module_6": "Security Governance, HIPAA Compliance & Immutable Audit Logging",
        },
        "endpoints": {
            "auth": "/api/v1/auth/",
        }
    })


urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
]
