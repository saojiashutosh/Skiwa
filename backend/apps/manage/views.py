"""
Staff-only management API powering the /studio frontend panel.

Every view requires an authenticated staff user — this is the real security
boundary; the frontend's route guard is only UX.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.collections.models import Collection
from apps.core.models import Banner, PageCopy
from apps.coupons.models import Coupon
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from apps.orders.tasks import send_order_status_email
from apps.products.models import Category, Color, Inventory, Product, ProductImage, Size, Variant
from apps.reviews.models import Review

from .serializers import (
    AdminBannerSerializer,
    AdminCategorySerializer,
    AdminCollectionSerializer,
    AdminColorSerializer,
    AdminCouponSerializer,
    AdminOrderListSerializer,
    AdminPageCopySerializer,
    AdminProductImageSerializer,
    AdminProductSerializer,
    AdminReviewSerializer,
    AdminSizeSerializer,
    AdminVariantSerializer,
    OrderStatusUpdateSerializer,
)

User = get_user_model()


class IsStaff(permissions.IsAdminUser):
    """Explicit alias — every /api/manage/ view uses this."""


class StatsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        paid_orders = Order.objects.filter(payment_status=Order.PaymentStatus.PAID)
        low_stock = (
            Inventory.objects.select_related("variant__product", "variant__size", "variant__color")
            .filter(quantity__lte=F("low_stock_threshold"))
            .order_by("quantity")
        )
        recent_orders = (
            Order.objects.annotate(item_count=Count("items")).order_by("-created_at")[:6]
        )
        return Response(
            {
                "revenue_total": str(paid_orders.aggregate(total=Sum("total"))["total"] or 0),
                "orders_total": Order.objects.count(),
                "orders_open": Order.objects.filter(
                    status__in=[
                        Order.Status.PENDING,
                        Order.Status.CONFIRMED,
                        Order.Status.PROCESSING,
                    ]
                ).count(),
                "customers_total": User.objects.filter(is_staff=False).count(),
                "products_total": Product.objects.count(),
                "low_stock_count": low_stock.count(),
                "low_stock": [
                    {
                        "variant_id": inv.variant_id,
                        "product": inv.variant.product.name,
                        "product_id": inv.variant.product_id,
                        "sku": inv.variant.sku,
                        "quantity": inv.quantity,
                    }
                    for inv in low_stock[:10]
                ],
                "recent_orders": AdminOrderListSerializer(recent_orders, many=True).data,
            }
        )


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaff]


class ProductAdminViewSet(AdminModelViewSet):
    serializer_class = AdminProductSerializer
    search_fields = ["name", "description", "variants__sku"]
    ordering_fields = ["created_at", "price", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return (
            Product.objects.select_related("category", "collection")
            .prefetch_related("images", "variants__color", "variants__size", "variants__inventory")
            .distinct()
        )


class ProductImageAdminViewSet(AdminModelViewSet):
    serializer_class = AdminProductImageSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = ProductImage.objects.all()
        product_id = self.request.query_params.get("product")
        return queryset.filter(product_id=product_id) if product_id else queryset


class VariantAdminViewSet(AdminModelViewSet):
    serializer_class = AdminVariantSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = Variant.objects.select_related("color", "size", "inventory", "product")
        product_id = self.request.query_params.get("product")
        return queryset.filter(product_id=product_id) if product_id else queryset


class CategoryAdminViewSet(AdminModelViewSet):
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()
    pagination_class = None


class CollectionAdminViewSet(AdminModelViewSet):
    serializer_class = AdminCollectionSerializer
    queryset = Collection.objects.all()
    pagination_class = None


class ColorAdminViewSet(AdminModelViewSet):
    serializer_class = AdminColorSerializer
    queryset = Color.objects.all()
    pagination_class = None


class SizeAdminViewSet(AdminModelViewSet):
    serializer_class = AdminSizeSerializer
    queryset = Size.objects.all()
    pagination_class = None


class CouponAdminViewSet(AdminModelViewSet):
    serializer_class = AdminCouponSerializer
    queryset = Coupon.objects.all()
    pagination_class = None


class BannerAdminViewSet(AdminModelViewSet):
    serializer_class = AdminBannerSerializer
    queryset = Banner.objects.all()
    pagination_class = None


class PageCopyAdminViewSet(AdminModelViewSet):
    serializer_class = AdminPageCopySerializer
    queryset = PageCopy.objects.all()
    pagination_class = None


class ReviewAdminViewSet(
    viewsets.mixins.ListModelMixin,
    viewsets.mixins.UpdateModelMixin,
    viewsets.mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaff]
    serializer_class = AdminReviewSerializer
    queryset = Review.objects.select_related("product", "user").order_by("-created_at")


class OrderAdminViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsStaff]
    lookup_field = "number"
    search_fields = ["number", "email", "items__sku"]

    def get_queryset(self):
        queryset = (
            Order.objects.prefetch_related("items")
            .annotate(item_count=Count("items", distinct=True))
            .order_by("-created_at")
        )
        order_status = self.request.query_params.get("status")
        return queryset.filter(status=order_status) if order_status else queryset

    def get_serializer_class(self):
        return AdminOrderListSerializer if self.action == "list" else OrderSerializer

    @action(detail=True, methods=["post"])
    def set_status(self, request, number=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        order.status = new_status
        if serializer.validated_data["tracking_number"]:
            order.tracking_number = serializer.validated_data["tracking_number"]
        if serializer.validated_data["tracking_url"]:
            order.tracking_url = serializer.validated_data["tracking_url"]
        update_fields = ["status", "tracking_number", "tracking_url"]

        if new_status == Order.Status.SHIPPED and not order.shipped_at:
            order.shipped_at = timezone.now()
            update_fields.append("shipped_at")
            send_order_status_email.delay(order.pk, "shipped")
        if new_status == Order.Status.DELIVERED and not order.delivered_at:
            order.delivered_at = timezone.now()
            update_fields.append("delivered_at")
            send_order_status_email.delay(order.pk, "delivered")

        order.save(update_fields=update_fields)
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
