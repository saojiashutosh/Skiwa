from .base import PaymentProvider
from .razorpay_provider import RazorpayProvider

PROVIDERS: dict[str, type[PaymentProvider]] = {
    "razorpay": RazorpayProvider,
}


def get_provider(name: str = "razorpay") -> PaymentProvider:
    try:
        return PROVIDERS[name]()
    except KeyError:
        raise ValueError(f"Unknown payment provider: {name}")
