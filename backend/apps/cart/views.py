from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.coupons.models import Coupon

from .models import Cart, CartItem
from .serializers import (
    CartItemQuantitySerializer,
    CartItemWriteSerializer,
    CartMergeSerializer,
    CartSerializer,
)


def get_cart(user) -> Cart:
    cart, _ = Cart.objects.prefetch_related(
        "items__variant__product__images",
        "items__variant__color",
        "items__variant__size",
        "items__variant__inventory",
    ).get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(CartSerializer(get_cart(request.user)).data)

    def delete(self, request):
        cart = get_cart(request.user)
        cart.items.all().delete()
        cart.coupon = None
        cart.save(update_fields=["coupon"])
        return Response(CartSerializer(cart).data)


class CartItemCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_cart(request.user)
        variant = serializer.validated_data["variant"]
        quantity = serializer.validated_data["quantity"]

        item, created = CartItem.objects.get_or_create(
            cart=cart, variant=variant, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity = min(item.quantity + quantity, 10, variant.stock)
            item.save(update_fields=["quantity"])
        return Response(CartSerializer(get_cart(request.user)).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, item_id) -> CartItem:
        return get_object_or_404(CartItem, pk=item_id, cart__user=request.user)

    def patch(self, request, item_id):
        serializer = CartItemQuantitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.get_item(request, item_id)
        quantity = serializer.validated_data["quantity"]
        if item.variant.stock < quantity:
            return Response(
                {"detail": f"Only {item.variant.stock} left in stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(CartSerializer(get_cart(request.user)).data)

    def delete(self, request, item_id):
        self.get_item(request, item_id).delete()
        return Response(CartSerializer(get_cart(request.user)).data)


class CartCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = str(request.data.get("code", "")).upper().strip()
        cart = get_cart(request.user)
        try:
            coupon = Coupon.objects.get(code=code)
            coupon.validate_for(cart.subtotal)
        except Coupon.DoesNotExist:
            return Response({"detail": "Invalid coupon code."}, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        cart.coupon = coupon
        cart.save(update_fields=["coupon"])
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = get_cart(request.user)
        cart.coupon = None
        cart.save(update_fields=["coupon"])
        return Response(CartSerializer(cart).data)


class CartMergeView(APIView):
    """Merge a guest cart (kept in localStorage) into the server cart on login."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CartMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_cart(request.user)
        for entry in serializer.validated_data["items"]:
            variant, quantity = entry["variant"], entry["quantity"]
            item, created = CartItem.objects.get_or_create(
                cart=cart, variant=variant, defaults={"quantity": quantity}
            )
            if not created:
                item.quantity = min(max(item.quantity, quantity), 10, variant.stock)
                item.save(update_fields=["quantity"])
        return Response(CartSerializer(get_cart(request.user)).data)
