from django.core.management.base import BaseCommand
from accounts.models import User, UserRole


class Command(BaseCommand):
    help = "Seed the MediFlow administrator account"

    def handle(self, *args, **options):
        users_data = [
            {
                "email": "admin@mediflow.com",
                "username": "MediFlowAdmin",
                "password": "MediFlowAdmin@2751",
                "first_name": "Alexander",
                "last_name": "Vance",
                "role": UserRole.ADMIN,
                "phone_number": "+1 (555) 019-2831",
                "is_staff": True,
                "is_superuser": True,
            },
        ]

        for u in users_data:
            user, created = User.objects.get_or_create(
                email=u["email"],
                defaults={
                    "username": u.get("username"),
                    "first_name": u["first_name"],
                    "last_name": u["last_name"],
                    "role": u["role"],
                    "phone_number": u["phone_number"],
                    "is_staff": u.get("is_staff", False),
                    "is_superuser": u.get("is_superuser", False),
                },
            )
            user.set_password(u["password"])
            user.username = u.get("username")
            user.first_name = u["first_name"]
            user.last_name = u["last_name"]
            user.role = u["role"]
            user.phone_number = u["phone_number"]
            user.is_staff = u.get("is_staff", False)
            user.is_superuser = u.get("is_superuser", False)
            user.save()

            status_str = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"[{status_str}] {user.role}: {user.email} / @{user.username} (Password: {u['password']})")
            )

        self.stdout.write(self.style.SUCCESS("\n[MediFlow] Administrator account is ready."))
