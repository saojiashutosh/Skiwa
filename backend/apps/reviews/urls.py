from django.urls import path

from .views import MyReviewsView

urlpatterns = [
    path("mine/", MyReviewsView.as_view(), name="my-reviews"),
]
