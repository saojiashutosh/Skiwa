"""
Payment provider interface.

Adding Stripe (or any gateway) later means implementing this interface and
registering it in PROVIDERS — no changes to views, models, or order services.
"""
from abc import ABC, abstractmethod
from typing import Any

from apps.orders.models import Order

from ..models import Payment


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    def create_payment(self, order: Order) -> Payment:
        """Create a provider-side payment intent/order and a local Payment row."""

    @abstractmethod
    def checkout_payload(self, payment: Payment) -> dict[str, Any]:
        """What the frontend needs to open the provider's checkout."""

    @abstractmethod
    def verify(self, data: dict[str, Any]) -> Payment:
        """Verify a client-side success callback. Raises on tampering."""

    @abstractmethod
    def verify_webhook(self, body: bytes, signature: str) -> dict[str, Any]:
        """Verify a webhook signature and return the parsed event."""

    @abstractmethod
    def refund(self, payment: Payment) -> Payment:
        """Refund a captured payment."""
