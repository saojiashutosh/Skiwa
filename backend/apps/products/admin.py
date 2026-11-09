from django.contrib import admin

from .models import Category, Color, Inventory, Product, ProductImage, Size, Variant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image", "image_url", "alt_text", "sort_order"]


class VariantInline(admin.TabularInline):
    model = Variant
    extra = 1
    fields = ["sku", "color", "size", "price_override"]
    show_change_link = True


class InventoryInline(admin.StackedInline):
    model = Inventory
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name", "category", "collection", "price", "compare_at_price",
        "stock_display", "is_featured", "is_new_arrival", "is_trending", "is_active",
    ]
    list_filter = ["category", "collection", "is_featured", "is_new_arrival", "is_trending", "is_active"]
    list_editable = ["is_featured", "is_new_arrival", "is_trending", "is_active"]
    search_fields = ["name", "description", "variants__sku"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [ProductImageInline, VariantInline]
    list_select_related = ["category", "collection"]

    @admin.display(description="Stock")
    def stock_display(self, obj):
        total = sum(v.inventory.quantity for v in obj.variants.all() if hasattr(v, "inventory"))
        return total


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ["sku", "product", "color", "size", "price", "stock"]
    list_filter = ["color", "size"]
    search_fields = ["sku", "product__name"]
    inlines = [InventoryInline]
    list_select_related = ["product", "color", "size"]


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ["variant", "quantity", "low_stock_threshold", "is_low_stock", "updated_at"]
    list_editable = ["quantity"]
    search_fields = ["variant__sku", "variant__product__name"]

    @admin.display(boolean=True, description="Low stock")
    def is_low_stock(self, obj):
        return obj.is_low_stock


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort_order", "is_active"]
    list_editable = ["sort_order", "is_active"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "hex_code"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ["name", "label", "sort_order"]
    list_editable = ["sort_order"]
