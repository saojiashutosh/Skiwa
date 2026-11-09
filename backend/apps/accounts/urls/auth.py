from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from ..views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    RegisterView,
    ResendVerificationView,
    ResetPasswordView,
    VerifyEmailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("password/forgot/", ForgotPasswordView.as_view(), name="auth-password-forgot"),
    path("password/reset/", ResetPasswordView.as_view(), name="auth-password-reset"),
    path("email/verify/", VerifyEmailView.as_view(), name="auth-email-verify"),
    path("email/resend/", ResendVerificationView.as_view(), name="auth-email-resend"),
]
