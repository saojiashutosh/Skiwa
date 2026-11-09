from django.urls import include, path
from rest_framework.routers import DefaultRouter

from ..views import AddressViewSet, ChangePasswordView, MeView

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("", MeView.as_view(), name="profile-me"),
    path("password/change/", ChangePasswordView.as_view(), name="profile-password-change"),
    path("", include(router.urls)),
]
