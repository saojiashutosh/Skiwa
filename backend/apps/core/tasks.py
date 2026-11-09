import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger("skiwaa")


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_templated_email(self, subject: str, template: str, context: dict, to: list[str]):
    """Generic transactional email task used across apps."""
    try:
        html = render_to_string(f"emails/{template}.html", context)
        send_mail(
            subject=subject,
            message=context.get("plain_text", subject),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=to,
            html_message=html,
        )
        logger.info("Email '%s' sent to %s", subject, to)
    except Exception as exc:  # pragma: no cover - network failure path
        logger.warning("Email '%s' failed, retrying: %s", subject, exc)
        raise self.retry(exc=exc)


@shared_task
def send_newsletter_welcome_email(email: str):
    send_templated_email.delay(
        subject="Welcome to SKIWAA — Wear Your Energy",
        template="newsletter_welcome",
        context={"email": email, "frontend_url": settings.FRONTEND_URL},
        to=[email],
    )
