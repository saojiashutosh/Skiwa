from decimal import Decimal

from rest_framework import serializers

from .models import ShippingMethod


class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingMethod
        fields = ["id", "name", "code", "description", "price", "free_above", "eta_days_min", "eta_days_max"]


class ShippingEstimateSerializer(serializers.Serializer):
    pincode = serializers.RegexField(
        regex=r"^[1-9]\d{5}$",
        error_messages={"invalid": "Enter a valid 6-digit Indian PIN code."},
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"))
