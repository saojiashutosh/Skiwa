import json
import logging
from typing import Any

import razorpay
import requests
from django.conf import settings
from django.core.exceptions import ValidationError

from apps.orders.models import Order

from ..exceptions import PaymentGatewayError
from ..models import Payment
from .base import PaymentProvider

logger = logging.getLogger("skiwaa")

# Razorpay's SDK raises these directly off Exception with no shared base, so
# they have to be enumerated. requests errors cover DNS/TLS/timeout failures.
GATEWAY_ERRORS = (
    razorpay.errors.BadRequestError,
    razorpay.errors.GatewayError,
    razorpay.errors.ServerError,
    requests.exceptions.RequestException,
)


class RazorpayProvider(PaymentProvider):
    name = "razorpay"

    def __init__(self) -> None:
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_payment(self, order: Order) -> Payment:
        amount_paise = int(order.total * 100)  # Razorpay works in the smallest unit
        try:
            provider_order = self.client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order.number,
                    "notes": {"order_number": order.number, "email": order.email},
                }
            )
        except GATEWAY_ERRORS as exc:
            # The real reason (bad keys, gateway down) is for our logs only —
            # never surface gateway internals to the customer.
            logger.error(
                "Razorpay order creation failed for %s: %s: %s",
                order.number, type(exc).__name__, exc,
            )
            raise PaymentGatewayError from exc
        return Payment.objects.create(
            order=order,
            provider=Payment.Provider.RAZORPAY,
            amount=order.total,
            currency="INR",
            provider_order_id=provider_order["id"],
            raw_response=provider_order,
        )

    def checkout_payload(self, payment: Payment) -> dict[str, Any]:
        order = payment.order
        return {
            "key": settings.RAZORPAY_KEY_ID,
            "razorpay_order_id": payment.provider_order_id,
            "amount": int(payment.amount * 100),
            "currency": payment.currency,
            "name": "SKIWAA",
            "description": f"Order {order.number}",
            "prefill": {
                "name": order.shipping_address.get("full_name", ""),
                "email": order.email,
                "contact": order.shipping_address.get("phone", ""),
            },
            "theme": {"color": "#C1121F"},
        }

    def verify(self, data: dict[str, Any]) -> Payment:
        required = ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]
        if any(key not in data for key in required):
            raise ValidationError("Missing payment verification fields.")
        try:
            self.client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": data["razorpay_order_id"],
                    "razorpay_payment_id": data["razorpay_payment_id"],
                    "razorpay_signature": data["razorpay_signature"],
                }
            )
        except razorpay.errors.SignatureVerificationError:
            logger.warning("Razorpay signature verification failed for %s", data.get("razorpay_order_id"))
            raise ValidationError("Payment verification failed.")

        payment = Payment.objects.filter(provider_order_id=data["razorpay_order_id"]).first()
        if not payment:
            raise ValidationError("Unknown payment.")
        payment.provider_payment_id = data["razorpay_payment_id"]
        payment.provider_signature = data["razorpay_signature"]
        payment.status = Payment.Status.PAID
        payment.save(update_fields=["provider_payment_id", "provider_signature", "status"])
        return payment

    def verify_webhook(self, body: bytes, signature: str) -> dict[str, Any]:
        try:
            self.client.utility.verify_webhook_signature(
                body.decode("utf-8"), signature, settings.RAZORPAY_WEBHOOK_SECRET
            )
        except razorpay.errors.SignatureVerificationError:
            raise ValidationError("Invalid webhook signature.")
        return json.loads(body)

    def refund(self, payment: Payment) -> Payment:
        if not payment.provider_payment_id:
            raise ValidationError("No captured payment to refund.")
        try:
            refund = self.client.payment.refund(
                payment.provider_payment_id, {"amount": int(payment.amount * 100)}
            )
        except GATEWAY_ERRORS as exc:
            logger.error(
                "Razorpay refund failed for payment %s: %s: %s",
                payment.provider_payment_id, type(exc).__name__, exc,
            )
            raise PaymentGatewayError(
                "Could not reach the payment gateway to process this refund."
            ) from exc
        payment.provider_refund_id = refund.get("id", "")
        payment.status = Payment.Status.REFUND_INITIATED
        payment.raw_response = {**payment.raw_response, "refund": refund}
        payment.save(update_fields=["provider_refund_id", "status", "raw_response"])
        return payment
