from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from apps.collections.models import Collection
from apps.coupons.models import Coupon
from apps.products.models import Category, Color, Inventory, Product, ProductImage, Size, Variant
from apps.shipping.models import ShippingMethod


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ["name"]

    name = "Oversized Tees"


class CollectionFactory(DjangoModelFactory):
    class Meta:
        model = Collection
        django_get_or_create = ["name"]

    drop_number = "DROP 001"
    name = "Shadows & Souls"


class ColorFactory(DjangoModelFactory):
    class Meta:
        model = Color
        django_get_or_create = ["name"]

    name = "Jet Black"
    hex_code = "#0B0B0B"


class SizeFactory(DjangoModelFactory):
    class Meta:
        model = Size
        django_get_or_create = ["name"]

    name = "M"
    sort_order = 2


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product

    name = factory.Sequence(lambda n: f"Shadow Walker Tee {n}")
    category = factory.SubFactory(CategoryFactory)
    collection = factory.SubFactory(CollectionFactory)
    description = "Heavyweight oversized tee."
    price = Decimal("1499.00")
    is_active = True


class ProductImageFactory(DjangoModelFactory):
    class Meta:
        model = ProductImage

    product = factory.SubFactory(ProductFactory)
    image_url = "https://images.example.com/tee.jpg"
    sort_order = 0


class VariantFactory(DjangoModelFactory):
    class Meta:
        model = Variant

    product = factory.SubFactory(ProductFactory)
    color = factory.SubFactory(ColorFactory)
    size = factory.SubFactory(SizeFactory)
    sku = factory.Sequence(lambda n: f"SKW-TEST-{n}")


class InventoryFactory(DjangoModelFactory):
    class Meta:
        model = Inventory

    variant = factory.SubFactory(VariantFactory)
    quantity = 10


class CouponFactory(DjangoModelFactory):
    class Meta:
        model = Coupon
        django_get_or_create = ["code"]

    code = "ENERGY10"
    discount_type = Coupon.DiscountType.PERCENT
    value = Decimal("10.00")
    min_subtotal = Decimal("0.00")


class ShippingMethodFactory(DjangoModelFactory):
    class Meta:
        model = ShippingMethod
        django_get_or_create = ["code"]

    name = "Standard Shipping"
    code = "standard"
    price = Decimal("99.00")
    free_above = Decimal("1999.00")
