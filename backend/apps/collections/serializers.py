from rest_framework import serializers

from .models import Collection


class CollectionSerializer(serializers.ModelSerializer):
    image = serializers.CharField(source="image_src", read_only=True)
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Collection
        fields = [
            "id", "drop_number", "name", "slug", "tagline", "description",
            "image", "release_date", "is_featured", "product_count",
        ]
