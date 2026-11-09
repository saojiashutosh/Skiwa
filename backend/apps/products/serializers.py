from rest_framework import serializers

from .models import Category, Color, Product, ProductImage, Size, Variant


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "name", "slug", "hex_code"]


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ["id", "name", "label", "sort_order"]


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.CharField(source="image_src", read_only=True)
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "product_count"]


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.CharField(source="image_src", read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order"]


class VariantSerializer(serializers.ModelSerializer):
    color = ColorSerializer(read_only=True)
    size = SizeSerializer(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = Variant
        fields = ["id", "sku", "color", "size", "price", "stock"]


class BaseProductSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    collection = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    collection_name = serializers.CharField(source="collection.name", read_only=True, default=None)
    avg_rating = serializers.FloatField(read_only=True, default=None)
    review_count = serializers.IntegerField(read_only=True, default=0)
    in_stock = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)


class ProductListSerializer(BaseProductSerializer):
    primary_image = serializers.SerializerMethodField()
    hover_image = serializers.SerializerMethodField()
    colors = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "price", "compare_at_price", "discount_percent",
            "category", "category_name", "collection", "collection_name",
            "primary_image", "hover_image", "colors",
            "is_featured", "is_new_arrival", "is_trending",
            "in_stock", "avg_rating", "review_count",
        ]

    def _images(self, obj):
        return list(obj.images.all())

    def get_primary_image(self, obj):
        images = self._images(obj)
        return images[0].image_src if images else ""

    def get_hover_image(self, obj):
        images = self._images(obj)
        return images[1].image_src if len(images) > 1 else ""

    def get_colors(self, obj):
        seen: dict[int, Color] = {}
        for variant in obj.variants.all():
            if variant.color and variant.color.id not in seen:
                seen[variant.color.id] = variant.color
        return ColorSerializer(seen.values(), many=True).data


class ProductDetailSerializer(BaseProductSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "fabric", "care_instructions",
            "price", "compare_at_price", "discount_percent",
            "category", "category_name", "collection", "collection_name",
            "images", "variants",
            "is_featured", "is_new_arrival", "is_trending",
            "in_stock", "avg_rating", "review_count", "created_at",
        ]
