from django.urls import path

from .views import OrderCancelView, OrderDetailView, OrderListCreateView, OrderReturnView

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("<str:number>/", OrderDetailView.as_view(), name="order-detail"),
    path("<str:number>/cancel/", OrderCancelView.as_view(), name="order-cancel"),
    path("<str:number>/return/", OrderReturnView.as_view(), name="order-return"),
]
