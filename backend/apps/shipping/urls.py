from django.urls import path

from .views import ShippingEstimateView, ShippingMethodListView

urlpatterns = [
    path("methods/", ShippingMethodListView.as_view(), name="shipping-methods"),
    path("estimate/", ShippingEstimateView.as_view(), name="shipping-estimate"),
]
