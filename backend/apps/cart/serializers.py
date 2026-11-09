from rest_framework import serializers

from apps.coupons.serializers import CouponSerializer
from apps.products.models import Variant
from apps.products.serializers import VariantSerializer

from .models import Cart, CartItem


class CartItemProductSerializer(serializers.Serializer):
    """Compact product summary embedded in each cart line."""

    def to_representation(self, product):
        images = list(product.images.all())
        return {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "image": images[0].image_src if images else "",
        }


class CartItemSerializer(serializers.ModelSerializer):
    variant = VariantSerializer(read_only=True)
    product = CartItemProductSerializer(source="variant.product", read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "variant", "product", "quantity", "unit_price", "line_total"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    coupon = CouponSerializer(read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "coupon", "subtotal", "discount", "total", "updated_at"]


class CartItemWriteSerializer(serializers.Serializer):
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=Variant.objects.select_related("product").filter(product__is_active=True),
        source="variant",
    )
    quantity = serializers.IntegerField(min_value=1, max_value=10)

    def validate(self, attrs):
        variant = attrs["variant"]
        if variant.stock < attrs["quantity"]:
            raise serializers.ValidationError(
                {"quantity": f"Only {variant.stock} left in stock for {variant.sku}."}
            )
        return attrs


class CartItemQuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=10)


class CartMergeSerializer(serializers.Serializer):
    """Payload for merging a guest (localStorage) cart after login."""

    items = CartItemWriteSerializer(many=True)
