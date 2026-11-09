from decimal import Decimal

from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ["code", "description", "discount_type", "value"]


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"))

    def validate(self, attrs):
        try:
            coupon = Coupon.objects.get(code=attrs["code"].upper().strip())
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({"code": "Invalid coupon code."})
        try:
            coupon.validate_for(attrs["subtotal"])
        except ValidationError as exc:
            raise serializers.ValidationError({"code": exc.messages[0]})
        attrs["coupon"] = coupon
        attrs["discount"] = coupon.compute_discount(attrs["subtotal"])
        return attrs
