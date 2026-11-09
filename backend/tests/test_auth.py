import pytest

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
PROFILE_URL = "/api/profile/"


def test_register_returns_tokens_and_user(api_client):
    response = api_client.post(
        REGISTER_URL,
        {"email": "new@skiwaa.in", "password": "StrongPass!123", "first_name": "Neo"},
    )
    assert response.status_code == 201
    assert "access" in response.data and "refresh" in response.data
    assert response.data["user"]["email"] == "new@skiwaa.in"


def test_register_rejects_duplicate_email(api_client, user):
    response = api_client.post(
        REGISTER_URL, {"email": user.email, "password": "StrongPass!123"}
    )
    assert response.status_code == 400


def test_register_rejects_weak_password(api_client):
    response = api_client.post(REGISTER_URL, {"email": "a@b.in", "password": "123"})
    assert response.status_code == 400


def test_login_returns_user_payload(api_client, user):
    response = api_client.post(LOGIN_URL, {"email": user.email, "password": "StrongPass!123"})
    assert response.status_code == 200
    assert response.data["user"]["email"] == user.email
    assert "access" in response.data


def test_profile_requires_auth(api_client):
    assert api_client.get(PROFILE_URL).status_code == 401


def test_profile_update(auth_client):
    response = auth_client.patch(PROFILE_URL, {"first_name": "Kenshin", "phone": "9876543210"})
    assert response.status_code == 200
    assert response.data["first_name"] == "Kenshin"


def test_forgot_password_never_leaks_existence(api_client):
    response = api_client.post("/api/auth/password/forgot/", {"email": "ghost@skiwaa.in"})
    assert response.status_code == 200


def test_address_crud(auth_client):
    payload = {
        "kind": "shipping", "full_name": "Soul Walker", "phone": "9876543210",
        "line1": "42 Shadow Street", "city": "Mumbai", "state": "Maharashtra",
        "pincode": "400001", "is_default": True,
    }
    created = auth_client.post("/api/profile/addresses/", payload)
    assert created.status_code == 201
    listed = auth_client.get("/api/profile/addresses/")
    assert listed.status_code == 200 and len(listed.data) == 1
