from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product_name", "product_slug", "sku", "size", "color",
            "image", "unit_price", "quantity", "line_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    can_return = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "number", "email", "status", "status_display",
            "payment_status", "payment_status_display",
            "shipping_address", "billing_address",
            "subtotal", "discount", "coupon_code",
            "shipping_method", "shipping_fee", "total",
            "tracking_number", "tracking_url", "customer_note",
            "cancel_reason", "return_reason",
            "items", "can_cancel", "can_return",
            "created_at", "paid_at", "shipped_at", "delivered_at",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    preview_image = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = [
            "number", "status", "status_display", "payment_status",
            "total", "item_count", "preview_image", "created_at",
        ]

    def get_preview_image(self, obj) -> str:
        items = list(obj.items.all())
        return items[0].image if items else ""


class AddressPayloadSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=160)
    phone = serializers.RegexField(regex=r"^[6-9]\d{9}$")
    line1 = serializers.CharField(max_length=200)
    line2 = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=80)
    state = serializers.CharField(max_length=80)
    pincode = serializers.RegexField(regex=r"^[1-9]\d{5}$")
    country = serializers.CharField(max_length=60, required=False, default="India")


class OrderItemPayloadSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=10)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemPayloadSerializer(many=True, allow_empty=False)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    shipping_address = AddressPayloadSerializer(required=False)
    billing_address = AddressPayloadSerializer(required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")
    shipping_method_code = serializers.CharField(required=False, allow_blank=True, default="")
    customer_note = serializers.CharField(required=False, allow_blank=True, default="", max_length=500)

    def validate(self, attrs):
        if not attrs.get("address_id") and not attrs.get("shipping_address"):
            raise serializers.ValidationError(
                {"shipping_address": "Provide either address_id or a shipping_address."}
            )
        return attrs


class CancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="", max_length=500)


class ReturnSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)
