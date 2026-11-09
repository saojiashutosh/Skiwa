import pytest

from apps.core.models import PageCopy

pytestmark = pytest.mark.django_db


def test_page_copy_endpoint(api_client):
    PageCopy.objects.create(key="shop", eyebrow="The Catalog", title="Shop All")
    PageCopy.objects.create(key="collections", eyebrow="The Archive", title="Collections", body="Every drop is a chapter.")

    response = api_client.get("/api/content/")
    assert response.status_code == 200
    by_key = {entry["key"]: entry for entry in response.data}
    assert by_key["shop"]["title"] == "Shop All"
    assert by_key["collections"]["body"] == "Every drop is a chapter."


def test_newsletter_subscribe(api_client):
    response = api_client.post("/api/newsletter/subscribe/", {"email": "soul@skiwaa.in"})
    assert response.status_code == 201
    # Idempotent — resubscribing the same email doesn't error.
    response = api_client.post("/api/newsletter/subscribe/", {"email": "SOUL@skiwaa.in"})
    assert response.status_code == 201


def test_contact_message(api_client):
    response = api_client.post(
        "/api/contact/",
        {"name": "Soul", "email": "soul@skiwaa.in", "subject": "Sizing", "message": "Does the tee run big?"},
    )
    assert response.status_code == 201
