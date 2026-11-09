from django.urls import path

from .views import RazorpayOrderCreateView, RazorpayVerifyView, RazorpayWebhookView

urlpatterns = [
    path("razorpay/create/", RazorpayOrderCreateView.as_view(), name="razorpay-create"),
    path("razorpay/verify/", RazorpayVerifyView.as_view(), name="razorpay-verify"),
    path("webhook/razorpay/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
]
