from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ShippingMethod
from .serializers import ShippingEstimateSerializer, ShippingMethodSerializer


class ShippingMethodListView(generics.ListAPIView):
    serializer_class = ShippingMethodSerializer
    pagination_class = None
    queryset = ShippingMethod.objects.filter(is_active=True)


class ShippingEstimateView(APIView):
    """Quote every active method for a pincode + subtotal."""

    def post(self, request):
        serializer = ShippingEstimateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtotal = serializer.validated_data["subtotal"]
        quotes = [
            {
                **ShippingMethodSerializer(method).data,
                "fee": str(method.fee_for(subtotal)),
            }
            for method in ShippingMethod.objects.filter(is_active=True)
        ]
        return Response({"pincode": serializer.validated_data["pincode"], "quotes": quotes})
