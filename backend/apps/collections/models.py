from django.db import models
from django.utils.text import slugify

from apps.core.models import MediaMixin, TimeStampedModel


class Collection(TimeStampedModel, MediaMixin):
    """A drop. e.g. DROP 001 — Shadows & Souls."""

    drop_number = models.CharField(max_length=20, help_text='e.g. "DROP 001"')
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    release_date = models.DateField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Shown as the home page featured drop.")

    class Meta:
        ordering = ["sort_order", "-release_date"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.drop_number} — {self.name}"
