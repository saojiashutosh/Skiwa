from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.coupons.models import Coupon
from apps.products.models import Variant


class Cart(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="carts")

    def __str__(self) -> str:
        return f"Cart<{self.user.email}>"

    @property
    def subtotal(self) -> Decimal:
        return sum((item.line_total for item in self.items.all()), Decimal("0.00"))

    @property
    def discount(self) -> Decimal:
        if not self.coupon:
            return Decimal("0.00")
        try:
            self.coupon.validate_for(self.subtotal)
        except Exception:
            return Decimal("0.00")
        return self.coupon.compute_discount(self.subtotal)

    @property
    def total(self) -> Decimal:
        return self.subtotal - self.discount


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["cart", "variant"], name="unique_cart_variant")
        ]

    def __str__(self) -> str:
        return f"{self.variant} × {self.quantity}"

    @property
    def unit_price(self) -> Decimal:
        return self.variant.price

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity
