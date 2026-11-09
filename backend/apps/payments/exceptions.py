class PaymentGatewayError(Exception):
    """
    The payment gateway could not be reached, or rejected the request for a
    reason the customer cannot act on (bad API credentials, gateway outage,
    network failure).

    Deliberately distinct from django.core.exceptions.ValidationError, which
    this app uses for business rules the customer *can* act on ("this order is
    already paid"). Those map to 400; this maps to 502, because the failure is
    upstream and retrying may well succeed.
    """

    default_message = (
        "The payment gateway is unavailable right now. Your order has been saved — "
        "please try paying again in a moment."
    )

    def __init__(self, message: str = "") -> None:
        self.message = message or self.default_message
        super().__init__(self.message)
