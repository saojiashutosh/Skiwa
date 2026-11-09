import django_filters
from django.db import models

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    collection = django_filters.CharFilter(field_name="collection__slug")
    color = django_filters.BaseInFilter(field_name="variants__color__slug", distinct=True)
    size = django_filters.BaseInFilter(field_name="variants__size__name", distinct=True)
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    featured = django_filters.BooleanFilter(field_name="is_featured")
    new = django_filters.BooleanFilter(field_name="is_new_arrival")
    trending = django_filters.BooleanFilter(field_name="is_trending")
    on_sale = django_filters.BooleanFilter(method="filter_on_sale")

    class Meta:
        model = Product
        fields = []

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(total_stock__gt=0)
        if value is False:
            return queryset.filter(models.Q(total_stock__isnull=True) | models.Q(total_stock=0))
        return queryset

    def filter_on_sale(self, queryset, name, value):
        if value is True:
            return queryset.filter(compare_at_price__gt=models.F("price"))
        return queryset
