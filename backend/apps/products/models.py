from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.core.models import MediaMixin, TimeStampedModel


class Category(TimeStampedModel, MediaMixin):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=40, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    hex_code = models.CharField(max_length=7, default="#000000")

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class Size(models.Model):
    name = models.CharField(max_length=10, unique=True)  # S, M, L, XL, XXL, OS
    label = models.CharField(max_length=40, blank=True)  # e.g. "Oversized Medium"
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self) -> str:
        return self.name


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_listing_data(self):
        return (
            self.select_related("category", "collection")
            .prefetch_related("images", "variants__color", "variants__size", "variants__inventory")
            .annotate(
                avg_rating=models.Avg(
                    "reviews__rating", filter=models.Q(reviews__is_approved=True)
                ),
                review_count=models.Count(
                    "reviews", filter=models.Q(reviews__is_approved=True), distinct=True
                ),
                total_stock=models.Sum("variants__inventory__quantity"),
            )
        )


class Product(TimeStampedModel):
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    collection = models.ForeignKey(
        "collections.Collection",
        on_delete=models.SET_NULL,
        related_name="products",
        null=True,
        blank=True,
    )
    description = models.TextField()
    fabric = models.CharField(max_length=200, blank=True, default="240 GSM French Terry Cotton")
    care_instructions = models.TextField(
        blank=True,
        default="Machine wash cold, inside out. Do not bleach. Tumble dry low. Iron inside out.",
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Original price shown struck-through when on sale.",
    )
    is_featured = models.BooleanField(default=False, db_index=True)
    is_new_arrival = models.BooleanField(default=False, db_index=True)
    is_trending = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["-created_at"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name

    @property
    def in_stock(self) -> bool:
        total = getattr(self, "total_stock", None)
        if total is None:
            total = sum(
                v.inventory.quantity
                for v in self.variants.all()
                if hasattr(v, "inventory")
            )
        return bool(total and total > 0)

    @property
    def discount_percent(self) -> int:
        if self.compare_at_price and self.compare_at_price > self.price:
            return round((1 - self.price / self.compare_at_price) * 100)
        return 0


class ProductImage(TimeStampedModel, MediaMixin):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0, help_text="0 = primary, 1 = hover image")

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.product.name} — image {self.sort_order}"


class Variant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    color = models.ForeignKey(Color, on_delete=models.PROTECT, related_name="variants", null=True, blank=True)
    size = models.ForeignKey(Size, on_delete=models.PROTECT, related_name="variants")
    sku = models.CharField(max_length=64, unique=True)
    price_override = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Leave empty to use the product price.",
    )

    class Meta:
        ordering = ["size__sort_order"]
        constraints = [
            models.UniqueConstraint(fields=["product", "color", "size"], name="unique_variant")
        ]

    def __str__(self) -> str:
        parts = [self.product.name]
        if self.color:
            parts.append(self.color.name)
        parts.append(self.size.name)
        return " / ".join(parts)

    @property
    def price(self):
        return self.price_override if self.price_override is not None else self.product.price

    @property
    def stock(self) -> int:
        return self.inventory.quantity if hasattr(self, "inventory") else 0


class Inventory(TimeStampedModel):
    variant = models.OneToOneField(Variant, on_delete=models.CASCADE, related_name="inventory")
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)

    class Meta:
        verbose_name_plural = "inventories"

    def __str__(self) -> str:
        return f"{self.variant.sku}: {self.quantity} in stock"

    @property
    def is_low_stock(self) -> bool:
        return 0 < self.quantity <= self.low_stock_threshold
