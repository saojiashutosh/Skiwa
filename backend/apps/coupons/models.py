from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Coupon(TimeStampedModel):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percentage"
        FIXED = "fixed", "Fixed amount"

    code = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    min_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    max_discount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Cap for percentage coupons.",
    )
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total redemptions allowed.")
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def validate_for(self, subtotal: Decimal) -> None:
        """Raise ValidationError with a shopper-friendly message when unusable."""
        now = timezone.now()
        if not self.is_active:
            raise ValidationError("This coupon is no longer active.")
        if self.valid_from > now:
            raise ValidationError("This coupon is not active yet.")
        if self.valid_until and self.valid_until < now:
            raise ValidationError("This coupon has expired.")
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            raise ValidationError("This coupon has been fully redeemed.")
        if subtotal < self.min_subtotal:
            raise ValidationError(f"This coupon needs a minimum order of ₹{self.min_subtotal:,.0f}.")

    def compute_discount(self, subtotal: Decimal) -> Decimal:
        if self.discount_type == self.DiscountType.PERCENT:
            discount = (subtotal * self.value / Decimal("100")).quantize(Decimal("0.01"))
            if self.max_discount is not None:
                discount = min(discount, self.max_discount)
        else:
            discount = self.value
        return min(discount, subtotal)
