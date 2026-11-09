from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from apps.core.tasks import send_templated_email

from .tokens import email_verification_token


@shared_task
def send_verification_email(user_id: int):
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    link = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    send_templated_email.delay(
        subject="Verify your SKIWAA account",
        template="verify_email",
        context={"name": user.first_name or "there", "link": link, "plain_text": f"Verify your email: {link}"},
        to=[user.email],
    )


@shared_task
def send_password_reset_email(user_id: int):
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    send_templated_email.delay(
        subject="Reset your SKIWAA password",
        template="password_reset",
        context={"name": user.first_name or "there", "link": link, "plain_text": f"Reset your password: {link}"},
        to=[user.email],
    )
