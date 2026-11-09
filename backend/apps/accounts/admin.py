from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Address, User


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "full_name", "phone", "is_email_verified", "is_staff", "created_at"]
    list_filter = ["is_staff", "is_active", "is_email_verified"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    readonly_fields = ["last_login", "created_at", "updated_at"]
    inlines = [AddressInline]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("first_name", "last_name", "phone")}),
        ("Status", {"fields": ("is_active", "is_email_verified")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["full_name", "user", "kind", "city", "state", "pincode", "is_default"]
    list_filter = ["kind", "state"]
    search_fields = ["full_name", "user__email", "city", "pincode"]
