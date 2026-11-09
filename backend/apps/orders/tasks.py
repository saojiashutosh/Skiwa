from celery import shared_task
from django.conf import settings

from apps.core.tasks import send_templated_email

STATUS_SUBJECTS = {
    "cancelled": "Your SKIWAA order {number} has been cancelled",
    "return_requested": "Return request received for order {number}",
    "shipped": "Your SKIWAA order {number} is on its way",
    "delivered": "Your SKIWAA order {number} has been delivered",
}


def _order_context(order) -> dict:
    return {
        "number": order.number,
        "name": order.shipping_address.get("full_name", ""),
        "items": [
            {
                "name": item.product_name,
                "size": item.size,
                "color": item.color,
                "quantity": item.quantity,
                "unit_price": f"{item.unit_price:,.2f}",
                "line_total": f"{item.line_total:,.2f}",
            }
            for item in order.items.all()
        ],
        "subtotal": f"{order.subtotal:,.2f}",
        "discount": f"{order.discount:,.2f}",
        "shipping_fee": f"{order.shipping_fee:,.2f}",
        "total": f"{order.total:,.2f}",
        "shipping_address": order.shipping_address,
        "order_url": f"{settings.FRONTEND_URL}/account/orders/{order.number}",
        "frontend_url": settings.FRONTEND_URL,
    }


@shared_task
def send_order_confirmation_email(order_id: int):
    from .models import Order

    order = Order.objects.prefetch_related("items").filter(pk=order_id).first()
    if not order:
        return
    context = _order_context(order)
    context["plain_text"] = f"Order {order.number} confirmed. Total: ₹{order.total:,.2f}"
    send_templated_email.delay(
        subject=f"Order confirmed — {order.number}",
        template="order_confirmation",
        context=context,
        to=[order.email],
    )


@shared_task
def send_order_status_email(order_id: int, event: str):
    from .models import Order

    order = Order.objects.prefetch_related("items").filter(pk=order_id).first()
    if not order or event not in STATUS_SUBJECTS:
        return
    context = _order_context(order)
    context["event"] = event
    context["plain_text"] = STATUS_SUBJECTS[event].format(number=order.number)
    send_templated_email.delay(
        subject=STATUS_SUBJECTS[event].format(number=order.number),
        template="order_status",
        context=context,
        to=[order.email],
    )
