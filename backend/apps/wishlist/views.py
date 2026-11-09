from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer

from .models import Wishlist, WishlistItem


def get_wishlist(user) -> Wishlist:
    wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist = get_wishlist(request.user)
        product_ids = wishlist.items.values_list("product_id", flat=True)
        products = Product.objects.active().with_listing_data().filter(id__in=list(product_ids))
        return Response(
            {
                "count": products.count(),
                "products": ProductListSerializer(products, many=True).data,
            }
        )

    def post(self, request):
        """Toggle a product in the wishlist. Body: {"product_id": <id>}"""
        product = get_object_or_404(Product, pk=request.data.get("product_id"), is_active=True)
        wishlist = get_wishlist(request.user)
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        if not created:
            item.delete()
            return Response({"detail": "Removed from wishlist.", "wishlisted": False})
        return Response(
            {"detail": "Added to wishlist.", "wishlisted": True},
            status=status.HTTP_201_CREATED,
        )


class WishlistItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id: int):
        wishlist = get_wishlist(request.user)
        deleted, _ = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()
        if not deleted:
            return Response({"detail": "Not in wishlist."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"detail": "Removed from wishlist.", "wishlisted": False})
