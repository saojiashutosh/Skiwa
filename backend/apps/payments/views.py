from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

from . import services
from .exceptions import PaymentGatewayError
from .providers import get_provider


class PaymentThrottleMixin:
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payments"


class RazorpayOrderCreateView(PaymentThrottleMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order = get_object_or_404(
            Order, number=request.data.get("order_number", ""), user=request.user
        )
        try:
            payload = services.start_payment(order, "razorpay")
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        except PaymentGatewayError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(payload, status=status.HTTP_201_CREATED)


class RazorpayVerifyView(PaymentThrottleMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            payment = services.confirm_payment(request.data, "razorpay")
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        except PaymentGatewayError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_502_BAD_GATEWAY)
        if payment.order.user_id != request.user.id:
            return Response({"detail": "Not your order."}, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {"detail": "Payment verified.", "order": OrderSerializer(payment.order).data}
        )


class RazorpayWebhookView(APIView):
    """Server-to-server events from Razorpay. Auth is the webhook signature."""

    authentication_classes: list = []
    permission_classes = [permissions.AllowAny]
    throttle_classes: list = []

    def post(self, request):
        signature = request.headers.get("X-Razorpay-Signature", "")
        try:
            event = get_provider("razorpay").verify_webhook(request.body, signature)
        except ValidationError:
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)
        services.handle_webhook_event(event)
        return Response({"detail": "ok"})
