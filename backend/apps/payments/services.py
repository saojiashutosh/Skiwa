import logging

from django.core.exceptions import ValidationError

from apps.orders.models import Order
from apps.orders.services import mark_order_paid

from .models import Payment
from .providers import get_provider

logger = logging.getLogger("skiwaa")


def start_payment(order: Order, provider_name: str = "razorpay") -> dict:
    if order.payment_status == Order.PaymentStatus.PAID:
        raise ValidationError("This order is already paid.")
    if order.status == Order.Status.CANCELLED:
        raise ValidationError("This order has been cancelled.")
    provider = get_provider(provider_name)
    payment = provider.create_payment(order)
    return provider.checkout_payload(payment)


def confirm_payment(data: dict, provider_name: str = "razorpay") -> Payment:
    provider = get_provider(provider_name)
    payment = provider.verify(data)
    mark_order_paid(payment.order)
    return payment


def handle_webhook_event(event: dict) -> None:
    """Razorpay webhook events — the safety net if the client never returns."""
    kind = event.get("event", "")
    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    provider_order_id = entity.get("order_id", "")
    if not provider_order_id:
        return

    payment = Payment.objects.select_related("order").filter(
        provider_order_id=provider_order_id
    ).first()
    if not payment:
        logger.warning("Webhook for unknown provider order %s", provider_order_id)
        return

    if kind == "payment.captured":
        if payment.status != Payment.Status.PAID:
            payment.provider_payment_id = entity.get("id", "")
            payment.status = Payment.Status.PAID
            payment.save(update_fields=["provider_payment_id", "status"])
        mark_order_paid(payment.order)
    elif kind == "payment.failed":
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status"])
        order = payment.order
        if order.payment_status == Order.PaymentStatus.PENDING:
            order.payment_status = Order.PaymentStatus.FAILED
            order.save(update_fields=["payment_status"])
    elif kind == "refund.processed":
        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status"])
        order = payment.order
        order.payment_status = Order.PaymentStatus.REFUNDED
        order.save(update_fields=["payment_status"])


def initiate_refund(order: Order) -> None:
    payment = order.payments.filter(status=Payment.Status.PAID).first()
    if not payment:
        logger.warning("Refund requested for %s but no paid payment found", order.number)
        return
    try:
        get_provider(payment.provider).refund(payment)
    except Exception:
        logger.exception("Refund failed for order %s", order.number)
