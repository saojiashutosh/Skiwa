from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel
from apps.products.models import Product


class Wishlist(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    products = models.ManyToManyField(Product, through="WishlistItem", related_name="wishlisted_by")

    def __str__(self) -> str:
        return f"Wishlist<{self.user.email}>"


class WishlistItem(TimeStampedModel):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlist_items")

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["wishlist", "product"], name="unique_wishlist_product")
        ]

    def __str__(self) -> str:
        return f"{self.wishlist.user.email} ♥ {self.product.name}"
