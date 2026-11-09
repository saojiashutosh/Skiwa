from decimal import Decimal

import pytest

from tests.factories import (
    CategoryFactory,
    InventoryFactory,
    ProductFactory,
    ProductImageFactory,
    VariantFactory,
)

pytestmark = pytest.mark.django_db


def make_product(**kwargs):
    product = ProductFactory(**kwargs)
    ProductImageFactory(product=product)
    variant = VariantFactory(product=product)
    InventoryFactory(variant=variant)
    return product


def test_product_list(api_client):
    make_product()
    make_product()
    response = api_client.get("/api/products/")
    assert response.status_code == 200
    assert response.data["count"] == 2
    first = response.data["results"][0]
    assert {"name", "slug", "price", "primary_image", "in_stock"} <= set(first)


def test_product_detail_includes_variants(api_client):
    product = make_product()
    response = api_client.get(f"/api/products/{product.slug}/")
    assert response.status_code == 200
    assert response.data["variants"][0]["stock"] == 10
    assert response.data["in_stock"] is True


def test_inactive_products_hidden(api_client):
    make_product(is_active=False)
    response = api_client.get("/api/products/")
    assert response.data["count"] == 0


def test_price_filter(api_client):
    make_product(price=Decimal("999.00"))
    make_product(price=Decimal("2999.00"))
    response = api_client.get("/api/products/?max_price=1500")
    assert response.data["count"] == 1


def test_category_filter(api_client):
    hoodies = CategoryFactory(name="Oversized Hoodies")
    make_product(category=hoodies)
    make_product()
    response = api_client.get(f"/api/products/?category={hoodies.slug}")
    assert response.data["count"] == 1


def test_search(api_client):
    make_product(name="Neo Tokyo Racer Tee")
    make_product(name="Phantom Hoodie")
    response = api_client.get("/api/products/?search=tokyo")
    assert response.data["count"] == 1


def test_collections_endpoint(api_client):
    make_product()
    response = api_client.get("/api/collections/")
    assert response.status_code == 200
    assert response.data[0]["product_count"] == 1
