from django.urls import path

from .views import (
    CartCouponView,
    CartItemCreateView,
    CartItemDetailView,
    CartMergeView,
    CartView,
)

urlpatterns = [
    path("", CartView.as_view(), name="cart"),
    path("items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("items/<int:item_id>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("coupon/", CartCouponView.as_view(), name="cart-coupon"),
    path("merge/", CartMergeView.as_view(), name="cart-merge"),
]
