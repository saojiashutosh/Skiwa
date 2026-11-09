"""Shared pytest fixtures. Tests run on eager celery + local cache + locmem email.

The database comes from settings: with no DATABASE_URL set, tests use sqlite.
"""
import pytest
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def test_settings(settings):
    settings.CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_CLASSES": [],
    }


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email="soul@skiwaa.in", password="StrongPass!123", first_name="Soul"
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client
