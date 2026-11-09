from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimeStampedModel

from .managers import UserManager

PHONE_VALIDATOR = RegexValidator(
    regex=r"^[6-9]\d{9}$",
    message="Enter a valid 10-digit Indian mobile number.",
)

PINCODE_VALIDATOR = RegexValidator(
    regex=r"^[1-9]\d{5}$",
    message="Enter a valid 6-digit Indian PIN code.",
)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Email-first user model — no usernames, ever."""

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)
    phone = models.CharField(max_length=10, blank=True, validators=[PHONE_VALIDATOR])

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email


class Address(TimeStampedModel):
    class Kind(models.TextChoices):
        SHIPPING = "shipping", "Shipping"
        BILLING = "billing", "Billing"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.SHIPPING)
    full_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=10, validators=[PHONE_VALIDATOR])
    line1 = models.CharField("Address line 1", max_length=200)
    line2 = models.CharField("Address line 2", max_length=200, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=6, validators=[PINCODE_VALIDATOR])
    country = models.CharField(max_length=60, default="India")
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-updated_at"]
        verbose_name_plural = "addresses"

    def __str__(self) -> str:
        return f"{self.full_name}, {self.city} {self.pincode}"

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, kind=self.kind).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)
