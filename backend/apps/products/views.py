from django.db.models import Count, Q
from rest_framework import generics

from .filters import ProductFilter
from .models import Category, Color, Product, Size
from .serializers import (
    CategorySerializer,
    ColorSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    SizeSerializer,
)


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "description", "category__name", "collection__name"]
    ordering_fields = ["price", "created_at", "name", "avg_rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.active().with_listing_data()


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.active().with_listing_data()


class RelatedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        product = generics.get_object_or_404(Product.objects.active(), slug=self.kwargs["slug"])
        return (
            Product.objects.active()
            .with_listing_data()
            .filter(Q(category=product.category) | Q(collection=product.collection))
            .exclude(pk=product.pk)
            .distinct()[:4]
        )


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True).annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        )


class FacetView(generics.GenericAPIView):
    """Filter facets for the shop sidebar: all colors and sizes in one call."""

    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response

        return Response(
            {
                "colors": ColorSerializer(Color.objects.all(), many=True).data,
                "sizes": SizeSerializer(Size.objects.all(), many=True).data,
            }
        )
