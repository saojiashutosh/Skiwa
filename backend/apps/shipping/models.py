from decimal import Decimal

from django.db import models

from apps.core.models import TimeStampedModel


class ShippingMethod(TimeStampedModel):
    name = models.CharField(max_length=80, unique=True)
    code = models.SlugField(max_length=40, unique=True)
    description = models.CharField(max_length=200, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    free_above = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Subtotal at which this method becomes free.",
    )
    eta_days_min = models.PositiveIntegerField(default=3)
    eta_days_max = models.PositiveIntegerField(default=7)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "price"]

    def __str__(self) -> str:
        return self.name

    def fee_for(self, subtotal: Decimal) -> Decimal:
        if self.free_above is not None and subtotal >= self.free_above:
            return Decimal("0.00")
        return self.price
