from django.contrib import admin

from .models import ShippingMethod


@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "price", "free_above", "eta_days_min", "eta_days_max", "is_active"]
    list_editable = ["price", "is_active"]
    prepopulated_fields = {"code": ["name"]}
