"""Serializers for the staff-only management API (/api/manage/)."""
from django.utils.text import slugify
from rest_framework import serializers

from apps.collections.models import Collection
from apps.core.models import Banner, PageCopy
from apps.coupons.models import Coupon
from apps.orders.models import Order
from apps.products.models import Category, Color, Inventory, Product, ProductImage, Size, Variant
from apps.reviews.models import Review


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image_url", "sort_order", "is_active"]
        read_only_fields = ["slug"]


class AdminCollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = [
            "id", "drop_number", "name", "slug", "tagline", "description",
            "image_url", "release_date", "sort_order", "is_active", "is_featured",
        ]
        read_only_fields = ["slug"]


class AdminColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "name", "slug", "hex_code"]
        read_only_fields = ["slug"]


class AdminSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ["id", "name", "label", "sort_order"]


class AdminProductImageSerializer(serializers.ModelSerializer):
    url = serializers.CharField(source="image_src", read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "product", "image_url", "alt_text", "sort_order", "url"]


class AdminVariantSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(min_value=0)
    color_name = serializers.CharField(source="color.name", read_only=True, default="")
    size_name = serializers.CharField(source="size.name", read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Variant
        fields = [
            "id", "product", "color", "size", "sku", "price_override",
            "stock", "color_name", "size_name", "price",
        ]
        extra_kwargs = {"sku": {"required": False, "allow_blank": True}}

    def _default_sku(self, product, color, size) -> str:
        base = f"SKW-{slugify(product.name)[:12].upper()}"
        if color:
            base += f"-{color.slug[:3].upper()}"
        base += f"-{size.name}"
        sku, suffix = base, 1
        while Variant.objects.filter(sku=sku).exists():
            suffix += 1
            sku = f"{base}-{suffix}"
        return sku

    def create(self, validated_data):
        stock = validated_data.pop("stock")
        if not validated_data.get("sku"):
            validated_data["sku"] = self._default_sku(
                validated_data["product"], validated_data.get("color"), validated_data["size"]
            )
        variant = super().create(validated_data)
        Inventory.objects.create(variant=variant, quantity=stock)
        return variant

    def update(self, instance, validated_data):
        stock = validated_data.pop("stock", None)
        if not validated_data.get("sku"):
            validated_data.pop("sku", None)
        variant = super().update(instance, validated_data)
        if stock is not None:
            inventory, _ = Inventory.objects.update_or_create(
                variant=variant, defaults={"quantity": stock}
            )
            # Refresh the cached reverse relation so the response reflects the new stock.
            variant.inventory = inventory
        return variant


class AdminProductSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    collection = serializers.PrimaryKeyRelatedField(
        queryset=Collection.objects.all(), allow_null=True, required=False
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    collection_name = serializers.CharField(source="collection.name", read_only=True, default="")
    images = AdminProductImageSerializer(many=True, read_only=True)
    variants = AdminVariantSerializer(many=True, read_only=True)
    total_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "price", "compare_at_price",
            "category", "category_name", "collection", "collection_name",
            "description", "fabric", "care_instructions",
            "is_featured", "is_new_arrival", "is_trending", "is_active",
            "images", "variants", "total_stock", "created_at",
        ]
        read_only_fields = ["slug"]

    def get_total_stock(self, obj) -> int:
        return sum(v.inventory.quantity for v in obj.variants.all() if hasattr(v, "inventory"))


class AdminCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "description", "discount_type", "value", "min_subtotal",
            "max_discount", "valid_from", "valid_until", "usage_limit", "used_count", "is_active",
        ]
        read_only_fields = ["used_count"]


class AdminBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = [
            "id", "title", "subtitle", "cta_label", "cta_href",
            "placement", "image_url", "sort_order", "is_active",
        ]


class AdminPageCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = PageCopy
        fields = ["id", "key", "eyebrow", "title", "body"]


class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product_name", "user_email", "rating", "title", "body",
            "is_verified_purchase", "is_approved", "created_at",
        ]
        read_only_fields = [
            "product_name", "user_email", "rating", "title", "body",
            "is_verified_purchase", "created_at",
        ]


class AdminOrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "number", "email", "status", "status_display", "payment_status",
            "total", "item_count", "created_at",
        ]


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            Order.Status.PROCESSING,
            Order.Status.SHIPPED,
            Order.Status.DELIVERED,
            Order.Status.RETURNED,
        ]
    )
    tracking_number = serializers.CharField(required=False, allow_blank=True, default="")
    tracking_url = serializers.URLField(required=False, allow_blank=True, default="")
