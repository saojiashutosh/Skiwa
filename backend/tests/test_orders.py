from decimal import Decimal

import pytest

from apps.orders.models import Order
from apps.orders.services import mark_order_paid
from tests.factories import (
    CouponFactory,
    InventoryFactory,
    ProductImageFactory,
    ShippingMethodFactory,
    VariantFactory,
)

pytestmark = pytest.mark.django_db

ORDERS_URL = "/api/orders/"

ADDRESS = {
    "full_name": "Soul Walker", "phone": "9876543210", "line1": "42 Shadow Street",
    "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
}


def make_variant(stock=10, price=Decimal("1499.00")):
    variant = VariantFactory(product__price=price)
    ProductImageFactory(product=variant.product)
    InventoryFactory(variant=variant, quantity=stock)
    return variant


def place_order(client, variant, quantity=1, **extra):
    payload = {
        "items": [{"variant_id": variant.id, "quantity": quantity}],
        "shipping_address": ADDRESS,
        **extra,
    }
    return client.post(ORDERS_URL, payload, format="json")


def test_order_creation_computes_totals_server_side(auth_client):
    variant = make_variant()
    ShippingMethodFactory()
    response = place_order(auth_client, variant, quantity=2, shipping_method_code="standard")
    assert response.status_code == 201
    assert Decimal(response.data["subtotal"]) == Decimal("2998.00")
    # 2998 > free_above 1999 → free shipping
    assert Decimal(response.data["shipping_fee"]) == Decimal("0.00")
    assert Decimal(response.data["total"]) == Decimal("2998.00")


def test_order_reserves_stock(auth_client):
    variant = make_variant(stock=5)
    place_order(auth_client, variant, quantity=3)
    variant.inventory.refresh_from_db()
    assert variant.inventory.quantity == 2


def test_order_rejects_overselling(auth_client):
    variant = make_variant(stock=1)
    response = place_order(auth_client, variant, quantity=2)
    assert response.status_code == 400


def test_order_with_coupon(auth_client):
    variant = make_variant(price=Decimal("2000.00"))
    CouponFactory(code="ENERGY10")
    response = place_order(auth_client, variant, coupon_code="ENERGY10")
    assert Decimal(response.data["discount"]) == Decimal("200.00")
    assert Decimal(response.data["total"]) == Decimal("1800.00")


def test_cancel_restores_stock(auth_client):
    variant = make_variant(stock=5)
    created = place_order(auth_client, variant, quantity=2)
    number = created.data["number"]
    response = auth_client.post(f"{ORDERS_URL}{number}/cancel/", {"reason": "changed my mind"})
    assert response.status_code == 200
    variant.inventory.refresh_from_db()
    assert variant.inventory.quantity == 5


def test_mark_paid_is_idempotent(auth_client, user):
    variant = make_variant()
    created = place_order(auth_client, variant)
    order = Order.objects.get(number=created.data["number"])
    mark_order_paid(order)
    mark_order_paid(order)
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PAID
    assert order.status == Order.Status.CONFIRMED


def test_users_cannot_see_others_orders(auth_client, api_client, django_user_model):
    variant = make_variant()
    created = place_order(auth_client, variant)
    other = django_user_model.objects.create_user(email="other@skiwaa.in", password="StrongPass!123")
    api_client.force_authenticate(user=other)
    response = api_client.get(f"{ORDERS_URL}{created.data['number']}/")
    assert response.status_code == 404
