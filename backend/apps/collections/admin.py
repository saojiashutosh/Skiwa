from django.contrib import admin

from .models import Collection


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ["drop_number", "name", "release_date", "sort_order", "is_featured", "is_active"]
    list_editable = ["sort_order", "is_featured", "is_active"]
    prepopulated_fields = {"slug": ["name"]}
    search_fields = ["name", "drop_number", "tagline"]
