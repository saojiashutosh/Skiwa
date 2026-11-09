from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base with created/updated audit fields, shared by all apps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class MediaMixin(models.Model):
    """
    Image storage strategy: uploads go to Cloudinary via the default storage,
    while seeded/CDN images can live as plain URLs. `image_src` resolves the
    effective URL, preferring the upload.
    """

    image = models.ImageField(upload_to="skiwaa/", blank=True, null=True)
    image_url = models.URLField(blank=True, max_length=500)

    class Meta:
        abstract = True

    @property
    def image_src(self) -> str:
        if self.image:
            try:
                return self.image.url
            except ValueError:
                pass
        return self.image_url


class Banner(TimeStampedModel, MediaMixin):
    """Cinematic hero banners managed from the admin."""

    class Placement(models.TextChoices):
        HERO = "hero", "Home Hero"
        DROP = "drop", "Featured Drop"
        EDITORIAL = "editorial", "Editorial Strip"

    title = models.CharField(max_length=120)
    subtitle = models.CharField(max_length=240, blank=True)
    cta_label = models.CharField(max_length=60, blank=True)
    cta_href = models.CharField(max_length=200, blank=True)
    placement = models.CharField(max_length=20, choices=Placement.choices, default=Placement.HERO)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["placement", "sort_order"]

    def __str__(self) -> str:
        return f"{self.get_placement_display()}: {self.title}"


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email


class PageCopy(TimeStampedModel):
    """
    Backend-managed page copy (eyebrow / title / body) keyed by page,
    e.g. "shop", "collections". Lets the store owner edit storefront
    headings without a frontend deploy.
    """

    key = models.SlugField(max_length=50, unique=True)
    eyebrow = models.CharField(max_length=80, blank=True)
    title = models.CharField(max_length=120)
    body = models.TextField(blank=True)

    class Meta:
        ordering = ["key"]
        verbose_name_plural = "page copy"

    def __str__(self) -> str:
        return f"{self.key}: {self.title}"


class ContactMessage(TimeStampedModel):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.subject} — {self.email}"
