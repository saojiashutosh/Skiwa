from decimal import Decimal

import pytest

from apps.orders.models import Order
from tests.factories import (
    CategoryFactory,
    CollectionFactory,
    ColorFactory,
    InventoryFactory,
    ProductFactory,
    SizeFactory,
    VariantFactory,
)

pytestmark = pytest.mark.django_db

MANAGE = "/api/manage/"


@pytest.fixture
def staff_client(api_client, django_user_model):
    staff = django_user_model.objects.create_user(
        email="boss@skiwaa.in", password="StrongPass!123", is_staff=True
    )
    api_client.force_authenticate(user=staff)
    return api_client


def test_manage_requires_staff(auth_client):
    """A normal signed-in customer must be rejected."""
    assert auth_client.get(f"{MANAGE}stats/").status_code == 403
    assert auth_client.get(f"{MANAGE}products/").status_code == 403
    assert auth_client.post(f"{MANAGE}collections/", {}).status_code == 403


def test_manage_requires_auth(api_client):
    assert api_client.get(f"{MANAGE}stats/").status_code == 401


def test_stats(staff_client):
    variant = VariantFactory()
    InventoryFactory(variant=variant, quantity=2, low_stock_threshold=5)
    response = staff_client.get(f"{MANAGE}stats/")
    assert response.status_code == 200
    assert response.data["products_total"] == 1
    assert response.data["low_stock_count"] == 1
    assert response.data["low_stock"][0]["quantity"] == 2


def test_product_crud(staff_client):
    category = CategoryFactory()
    collection = CollectionFactory()
    created = staff_client.post(
        f"{MANAGE}products/",
        {
            "name": "Void Walker Tee",
            "category": category.id,
            "collection": collection.id,
            "description": "Heavyweight void energy.",
            "price": "1799.00",
            "is_featured": True,
        },
        format="json",
    )
    assert created.status_code == 201
    product_id = created.data["id"]
    assert created.data["slug"] == "void-walker-tee"

    updated = staff_client.patch(
        f"{MANAGE}products/{product_id}/", {"price": "1899.00"}, format="json"
    )
    assert updated.status_code == 200
    assert updated.data["price"] == "1899.00"

    assert staff_client.delete(f"{MANAGE}products/{product_id}/").status_code == 204


def test_variant_create_with_stock_and_auto_sku(staff_client):
    product = ProductFactory()
    color = ColorFactory()
    size = SizeFactory(name="L", sort_order=3)
    response = staff_client.post(
        f"{MANAGE}variants/",
        {"product": product.id, "color": color.id, "size": size.id, "stock": 15},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["stock"] == 15
    assert response.data["sku"].startswith("SKW-")

    patched = staff_client.patch(
        f"{MANAGE}variants/{response.data['id']}/", {"stock": 3}, format="json"
    )
    assert patched.status_code == 200
    assert patched.data["stock"] == 3


def test_product_image_crud(staff_client):
    product = ProductFactory()
    response = staff_client.post(
        f"{MANAGE}product-images/",
        {"product": product.id, "image_url": "https://images.example.com/x.jpg", "sort_order": 0},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["url"] == "https://images.example.com/x.jpg"


def test_order_status_update(staff_client, django_user_model):
    customer = django_user_model.objects.create_user(
        email="buyer@skiwaa.in", password="StrongPass!123"
    )
    order = Order.objects.create(
        user=customer,
        email=customer.email,
        shipping_address={"full_name": "Buyer"},
        billing_address={"full_name": "Buyer"},
        subtotal=Decimal("1499.00"),
        total=Decimal("1499.00"),
        status=Order.Status.CONFIRMED,
        payment_status=Order.PaymentStatus.PAID,
    )
    response = staff_client.post(
        f"{MANAGE}orders/{order.number}/set_status/",
        {"status": "shipped", "tracking_number": "AWB123"},
        format="json",
    )
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.SHIPPED
    assert order.tracking_number == "AWB123"
    assert order.shipped_at is not None
