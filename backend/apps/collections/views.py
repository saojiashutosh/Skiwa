from django.db.models import Count, Q
from rest_framework import generics

from .models import Collection
from .serializers import CollectionSerializer


def annotated_collections():
    return Collection.objects.filter(is_active=True).annotate(
        product_count=Count("products", filter=Q(products__is_active=True))
    )


class CollectionListView(generics.ListAPIView):
    serializer_class = CollectionSerializer
    pagination_class = None
    queryset = Collection.objects.none()

    def get_queryset(self):
        return annotated_collections()


class CollectionDetailView(generics.RetrieveAPIView):
    serializer_class = CollectionSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return annotated_collections()
