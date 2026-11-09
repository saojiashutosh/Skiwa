from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["order", "provider", "status", "amount", "provider_payment_id", "created_at"]
    list_filter = ["provider", "status"]
    search_fields = ["order__number", "provider_order_id", "provider_payment_id"]
    readonly_fields = [f.name for f in Payment._meta.fields]

    def has_add_permission(self, request):
        return False
