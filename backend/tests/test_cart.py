from decimal import Decimal

import pytest

from tests.factories import CouponFactory, InventoryFactory, ProductImageFactory, VariantFactory

pytestmark = pytest.mark.django_db

CART_URL = "/api/cart/"


def make_variant(stock=10, price=Decimal("1499.00")):
    variant = VariantFactory(product__price=price)
    ProductImageFactory(product=variant.product)
    InventoryFactory(variant=variant, quantity=stock)
    return variant


def test_cart_requires_auth(api_client):
    assert api_client.get(CART_URL).status_code == 401


def test_add_to_cart(auth_client):
    variant = make_variant()
    response = auth_client.post(f"{CART_URL}items/", {"variant_id": variant.id, "quantity": 2})
    assert response.status_code == 201
    assert Decimal(response.data["subtotal"]) == Decimal("2998.00")


def test_add_beyond_stock_rejected(auth_client):
    variant = make_variant(stock=1)
    response = auth_client.post(f"{CART_URL}items/", {"variant_id": variant.id, "quantity": 3})
    assert response.status_code == 400


def test_update_quantity(auth_client):
    variant = make_variant()
    created = auth_client.post(f"{CART_URL}items/", {"variant_id": variant.id, "quantity": 1})
    item_id = created.data["items"][0]["id"]
    response = auth_client.patch(f"{CART_URL}items/{item_id}/", {"quantity": 3})
    assert response.status_code == 200
    assert response.data["items"][0]["quantity"] == 3


def test_apply_coupon(auth_client):
    variant = make_variant()
    CouponFactory(code="ENERGY10")
    auth_client.post(f"{CART_URL}items/", {"variant_id": variant.id, "quantity": 1})
    response = auth_client.post(f"{CART_URL}coupon/", {"code": "energy10"})
    assert response.status_code == 200
    assert Decimal(response.data["discount"]) == Decimal("149.90")


def test_invalid_coupon(auth_client):
    make_variant()
    response = auth_client.post(f"{CART_URL}coupon/", {"code": "FAKE"})
    assert response.status_code == 400


def test_merge_guest_cart(auth_client):
    variant = make_variant()
    response = auth_client.post(
        f"{CART_URL}merge/",
        {"items": [{"variant_id": variant.id, "quantity": 2}]},
        format="json",
    )
    assert response.status_code == 200
    assert response.data["items"][0]["quantity"] == 2


def test_wishlist_toggle(auth_client):
    variant = make_variant()
    product_id = variant.product_id
    added = auth_client.post("/api/wishlist/", {"product_id": product_id})
    assert added.status_code == 201 and added.data["wishlisted"] is True
    removed = auth_client.post("/api/wishlist/", {"product_id": product_id})
    assert removed.data["wishlisted"] is False
