from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BannerAdminViewSet,
    CategoryAdminViewSet,
    CollectionAdminViewSet,
    ColorAdminViewSet,
    CouponAdminViewSet,
    OrderAdminViewSet,
    PageCopyAdminViewSet,
    ProductAdminViewSet,
    ProductImageAdminViewSet,
    ReviewAdminViewSet,
    SizeAdminViewSet,
    StatsView,
    VariantAdminViewSet,
)

router = DefaultRouter()
router.register("products", ProductAdminViewSet, basename="manage-products")
router.register("product-images", ProductImageAdminViewSet, basename="manage-product-images")
router.register("variants", VariantAdminViewSet, basename="manage-variants")
router.register("categories", CategoryAdminViewSet, basename="manage-categories")
router.register("collections", CollectionAdminViewSet, basename="manage-collections")
router.register("colors", ColorAdminViewSet, basename="manage-colors")
router.register("sizes", SizeAdminViewSet, basename="manage-sizes")
router.register("coupons", CouponAdminViewSet, basename="manage-coupons")
router.register("banners", BannerAdminViewSet, basename="manage-banners")
router.register("page-copy", PageCopyAdminViewSet, basename="manage-page-copy")
router.register("reviews", ReviewAdminViewSet, basename="manage-reviews")
router.register("orders", OrderAdminViewSet, basename="manage-orders")

urlpatterns = [
    path("stats/", StatsView.as_view(), name="manage-stats"),
    path("", include(router.urls)),
]
