from rest_framework import serializers

from .models import Banner, ContactMessage, NewsletterSubscriber, PageCopy


class PageCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = PageCopy
        fields = ["key", "eyebrow", "title", "body"]


class BannerSerializer(serializers.ModelSerializer):
    image = serializers.CharField(source="image_src", read_only=True)

    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "cta_label", "cta_href", "placement", "image"]


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["email"]

    def create(self, validated_data):
        subscriber, _ = NewsletterSubscriber.objects.update_or_create(
            email=validated_data["email"].lower(), defaults={"is_active": True}
        )
        return subscriber


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]
