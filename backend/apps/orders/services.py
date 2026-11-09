"""
Order domain services.

All money math and stock movement happens here, server-side, inside a
transaction — the client only ever sends variant ids and quantities.
"""
from dataclasses import dataclass
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.accounts.models import Address
from apps.cart.models import Cart
from apps.coupons.models import Coupon
from apps.products.models import Inventory, Variant
from apps.shipping.models import ShippingMethod

from .models import Order, OrderItem


@dataclass
class OrderLine:
    variant: Variant
    quantity: int


class OrderError(ValidationError):
    pass


def _address_snapshot(data: dict) -> dict:
    keys = ["full_name", "phone", "line1", "line2", "city", "state", "pincode"]
    snapshot = {key: str(data.get(key, "") or "") for key in keys}
    snapshot["country"] = str(data.get("country") or "India")
    return snapshot


def _resolve_address(user, address_id, address_data) -> dict:
    if address_id:
        address = Address.objects.filter(user=user, pk=address_id).first()
        if not address:
            raise OrderError("Address not found.")
        return _address_snapshot(address.__dict__)
    if address_data:
        return _address_snapshot(address_data)
    raise OrderError("A shipping address is required.")


@transaction.atomic
def create_order(
    *,
    user,
    items: list[dict],
    address_id=None,
    shipping_address=None,
    billing_address=None,
    coupon_code: str = "",
    shipping_method_code: str = "",
    customer_note: str = "",
) -> Order:
    if not items:
        raise OrderError("Your cart is empty.")

    lines: list[OrderLine] = []
    subtotal = Decimal("0.00")
    for entry in items:
        variant = (
            Variant.objects.select_related("product", "color", "size")
            .prefetch_related("product__images")
            .filter(pk=entry["variant_id"], product__is_active=True)
            .first()
        )
        if not variant:
            raise OrderError("One of the items is no longer available.")
        quantity = int(entry["quantity"])
        if quantity < 1 or quantity > 10:
            raise OrderError("Quantity must be between 1 and 10.")

        # Lock the inventory row to prevent overselling under concurrency.
        inventory = Inventory.objects.select_for_update().filter(variant=variant).first()
        available = inventory.quantity if inventory else 0
        if available < quantity:
            raise OrderError(
                f"Only {available} left in stock for {variant.product.name} ({variant.size.name})."
            )
        lines.append(OrderLine(variant=variant, quantity=quantity))
        subtotal += variant.price * quantity

    # Coupon — validated against the server-computed subtotal.
    coupon = None
    discount = Decimal("0.00")
    if coupon_code:
        coupon = Coupon.objects.filter(code=coupon_code.upper().strip()).first()
        if not coupon:
            raise OrderError("Invalid coupon code.")
        coupon.validate_for(subtotal)
        discount = coupon.compute_discount(subtotal)

    # Shipping
    shipping_fee = Decimal("0.00")
    shipping_method_name = ""
    if shipping_method_code:
        method = ShippingMethod.objects.filter(code=shipping_method_code, is_active=True).first()
        if not method:
            raise OrderError("Selected shipping method is unavailable.")
        shipping_fee = method.fee_for(subtotal)
        shipping_method_name = method.name

    shipping_snapshot = _resolve_address(user, address_id, shipping_address)
    billing_snapshot = _address_snapshot(billing_address) if billing_address else shipping_snapshot

    order = Order.objects.create(
        user=user,
        email=user.email,
        shipping_address=shipping_snapshot,
        billing_address=billing_snapshot,
        subtotal=subtotal,
        discount=discount,
        coupon=coupon,
        coupon_code=coupon.code if coupon else "",
        shipping_method=shipping_method_name,
        shipping_fee=shipping_fee,
        total=subtotal - discount + shipping_fee,
        customer_note=customer_note,
    )

    for line in lines:
        variant = line.variant
        images = list(variant.product.images.all())
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=variant.product.name,
            product_slug=variant.product.slug,
            sku=variant.sku,
            size=variant.size.name,
            color=variant.color.name if variant.color else "",
            image=images[0].image_src if images else "",
            unit_price=variant.price,
            quantity=line.quantity,
        )
        # Reserve stock immediately — restored on cancellation or failure.
        Inventory.objects.filter(variant=variant).update(quantity=F("quantity") - line.quantity)

    return order


def mark_order_paid(order: Order) -> Order:
    """Idempotent transition to paid/confirmed. Called by the payment layer."""
    if order.payment_status == Order.PaymentStatus.PAID:
        return order
    order.payment_status = Order.PaymentStatus.PAID
    order.status = Order.Status.CONFIRMED
    order.paid_at = timezone.now()
    order.save(update_fields=["payment_status", "status", "paid_at"])

    if order.coupon_id:
        Coupon.objects.filter(pk=order.coupon_id).update(used_count=F("used_count") + 1)

    if order.user_id:
        _clear_cart(order.user_id)

    from .tasks import send_order_confirmation_email

    send_order_confirmation_email.delay(order.pk)
    return order


def _clear_cart(user_id) -> None:
    cart = Cart.objects.filter(user_id=user_id).first()
    if cart:
        cart.items.all().delete()
        cart.coupon = None
        cart.save(update_fields=["coupon"])


def cancel_order(order: Order, reason: str = "") -> Order:
    if not order.can_cancel:
        raise OrderError("This order can no longer be cancelled.")
    was_paid = order.payment_status == Order.PaymentStatus.PAID
    order.status = Order.Status.CANCELLED
    order.cancel_reason = reason
    if was_paid:
        order.payment_status = Order.PaymentStatus.REFUND_INITIATED
    order.save(update_fields=["status", "cancel_reason", "payment_status"])
    order.restock_items()

    if was_paid:
        from apps.payments.services import initiate_refund

        initiate_refund(order)

    from .tasks import send_order_status_email

    send_order_status_email.delay(order.pk, "cancelled")
    return order


def request_return(order: Order, reason: str) -> Order:
    if not order.can_return:
        raise OrderError("This order is not eligible for return (7-day window from delivery).")
    if not reason.strip():
        raise OrderError("Please tell us why you want to return this order.")
    order.status = Order.Status.RETURN_REQUESTED
    order.return_reason = reason
    order.save(update_fields=["status", "return_reason"])

    from .tasks import send_order_status_email

    send_order_status_email.delay(order.pk, "return_requested")
    return order
