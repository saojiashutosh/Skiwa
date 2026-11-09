from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "rating", "title", "body", "author", "is_verified_purchase", "created_at"]
        read_only_fields = ["id", "author", "is_verified_purchase", "created_at"]

    def get_author(self, obj) -> str:
        first = obj.user.first_name or obj.user.email.split("@")[0]
        last_initial = f" {obj.user.last_name[0]}." if obj.user.last_name else ""
        return f"{first}{last_initial}"
