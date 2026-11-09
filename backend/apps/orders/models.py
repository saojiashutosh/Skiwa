import secrets
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel
from apps.coupons.models import Coupon
from apps.products.models import Variant


def generate_order_number() -> str:
    """Human-friendly, unguessable order number, e.g. SKW-8F3K2A9D."""
    return f"SKW-{secrets.token_hex(4).upper()}"


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        RETURN_REQUESTED = "return_requested", "Return requested"
        RETURNED = "returned", "Returned"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUND_INITIATED = "refund_initiated", "Refund initiated"
        REFUNDED = "refunded", "Refunded"

    number = models.CharField(max_length=20, unique=True, default=generate_order_number, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="orders"
    )
    email = models.EmailField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )

    # Address snapshots — orders must survive address edits/deletes.
    shipping_address = models.JSONField()
    billing_address = models.JSONField()

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    coupon_code = models.CharField(max_length=40, blank=True)
    shipping_method = models.CharField(max_length=80, blank=True)
    shipping_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2)

    tracking_number = models.CharField(max_length=100, blank=True)
    tracking_url = models.URLField(blank=True)
    customer_note = models.TextField(blank=True)
    cancel_reason = models.TextField(blank=True)
    return_reason = models.TextField(blank=True)

    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["number"]), models.Index(fields=["-created_at"])]

    def __str__(self) -> str:
        return self.number

    @property
    def can_cancel(self) -> bool:
        return self.status in {self.Status.PENDING, self.Status.CONFIRMED, self.Status.PROCESSING}

    @property
    def can_return(self) -> bool:
        if self.status != self.Status.DELIVERED or not self.delivered_at:
            return False
        return (timezone.now() - self.delivered_at).days <= 7

    def restock_items(self) -> None:
        """Return reserved stock to inventory (cancel / failed payment)."""
        for item in self.items.select_related("variant__inventory"):
            if item.variant and hasattr(item.variant, "inventory"):
                inventory = item.variant.inventory
                inventory.quantity = models.F("quantity") + item.quantity
                inventory.save(update_fields=["quantity"])


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(Variant, on_delete=models.SET_NULL, null=True, related_name="order_items")

    # Snapshots so the order remains legible if the catalog changes.
    product_name = models.CharField(max_length=160)
    product_slug = models.SlugField(max_length=180)
    sku = models.CharField(max_length=64)
    size = models.CharField(max_length=10)
    color = models.CharField(max_length=40, blank=True)
    image = models.URLField(blank=True, max_length=500)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.product_name} ({self.sku}) × {self.quantity}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity
