from django.contrib import admin
from django.utils import timezone

from .models import Order, OrderItem
from .tasks import send_order_status_email


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product_name", "sku", "size", "color", "unit_price", "quantity"]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "number", "user", "status", "payment_status", "total", "created_at",
    ]
    list_filter = ["status", "payment_status", "created_at"]
    search_fields = ["number", "email", "user__email", "tracking_number"]
    readonly_fields = [
        "number", "user", "email", "shipping_address", "billing_address",
        "subtotal", "discount", "coupon_code", "shipping_fee", "total",
        "paid_at", "created_at", "updated_at",
    ]
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"
    actions = ["mark_processing", "mark_shipped", "mark_delivered"]

    @admin.action(description="Mark selected orders as processing")
    def mark_processing(self, request, queryset):
        queryset.filter(status=Order.Status.CONFIRMED).update(status=Order.Status.PROCESSING)

    @admin.action(description="Mark selected orders as shipped")
    def mark_shipped(self, request, queryset):
        for order in queryset.filter(status__in=[Order.Status.CONFIRMED, Order.Status.PROCESSING]):
            order.status = Order.Status.SHIPPED
            order.shipped_at = timezone.now()
            order.save(update_fields=["status", "shipped_at"])
            send_order_status_email.delay(order.pk, "shipped")

    @admin.action(description="Mark selected orders as delivered")
    def mark_delivered(self, request, queryset):
        for order in queryset.filter(status=Order.Status.SHIPPED):
            order.status = Order.Status.DELIVERED
            order.delivered_at = timezone.now()
            order.save(update_fields=["status", "delivered_at"])
            send_order_status_email.delay(order.pk, "delivered")
