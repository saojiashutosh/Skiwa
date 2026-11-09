from django.urls import path

from .views import (
    BannerListView,
    ContactMessageView,
    NewsletterSubscribeView,
    PageCopyListView,
)

urlpatterns = [
    path("banners/", BannerListView.as_view(), name="banner-list"),
    path("content/", PageCopyListView.as_view(), name="page-copy"),
    path("newsletter/subscribe/", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
    path("contact/", ContactMessageView.as_view(), name="contact"),
]
