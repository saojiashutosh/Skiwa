from django.contrib import admin

from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    raw_id_fields = ["product"]


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ["user", "product_count", "updated_at"]
    search_fields = ["user__email"]
    inlines = [WishlistItemInline]

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.items.count()
