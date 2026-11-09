from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CouponSerializer, CouponValidateSerializer


class CouponValidateView(APIView):
    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(
            {
                "coupon": CouponSerializer(data["coupon"]).data,
                "discount": str(data["discount"]),
            },
            status=status.HTTP_200_OK,
        )
