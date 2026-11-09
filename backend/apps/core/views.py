from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Banner, PageCopy
from .serializers import (
    BannerSerializer,
    ContactMessageSerializer,
    NewsletterSerializer,
    PageCopySerializer,
)
from .tasks import send_newsletter_welcome_email


class PageCopyListView(generics.ListAPIView):
    """All storefront page copy in one call — the table stays tiny."""

    serializer_class = PageCopySerializer
    pagination_class = None
    queryset = PageCopy.objects.all()


class BannerListView(generics.ListAPIView):
    serializer_class = BannerSerializer
    pagination_class = None

    def get_queryset(self):
        qs = Banner.objects.filter(is_active=True)
        placement = self.request.query_params.get("placement")
        if placement:
            qs = qs.filter(placement=placement)
        return qs


class NewsletterSubscribeView(generics.CreateAPIView):
    serializer_class = NewsletterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "newsletter"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscriber = serializer.save()
        send_newsletter_welcome_email.delay(subscriber.email)
        return Response(
            {"detail": "You are on the list. Welcome to the energy."},
            status=status.HTTP_201_CREATED,
        )


class ContactMessageView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Message received. We reply within 24–48 hours."},
            status=status.HTTP_201_CREATED,
        )
