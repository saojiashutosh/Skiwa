from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers

from apps.orders.models import Order, OrderItem
from apps.products.models import Product

from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_product(self) -> Product:
        return get_object_or_404(Product, slug=self.kwargs["slug"], is_active=True)

    def get_queryset(self):
        return Review.objects.filter(
            product=self.get_product(), is_approved=True
        ).select_related("user")

    def perform_create(self, serializer):
        product = self.get_product()
        user = self.request.user
        if Review.objects.filter(product=product, user=user).exists():
            raise serializers.ValidationError({"detail": "You have already reviewed this product."})
        verified = OrderItem.objects.filter(
            order__user=user,
            order__status__in=[Order.Status.DELIVERED, Order.Status.SHIPPED, Order.Status.CONFIRMED],
            product_slug=product.slug,
        ).exists()
        serializer.save(product=product, user=user, is_verified_purchase=verified)


class MyReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related("user")
