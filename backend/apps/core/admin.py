from django.contrib import admin

from .models import Banner, ContactMessage, NewsletterSubscriber, PageCopy


@admin.register(PageCopy)
class PageCopyAdmin(admin.ModelAdmin):
    list_display = ["key", "eyebrow", "title", "updated_at"]
    list_editable = ["eyebrow", "title"]
    search_fields = ["key", "title", "body"]
    prepopulated_fields = {"key": ["title"]}


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ["title", "placement", "sort_order", "is_active", "updated_at"]
    list_filter = ["placement", "is_active"]
    list_editable = ["sort_order", "is_active"]
    search_fields = ["title", "subtitle"]


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["email"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["subject", "name", "email", "is_resolved", "created_at"]
    list_filter = ["is_resolved"]
    search_fields = ["subject", "email", "name"]
    list_editable = ["is_resolved"]
