from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API
    path("api/auth/", include("apps.accounts.urls.auth")),
    path("api/profile/", include("apps.accounts.urls.profile")),
    path("api/products/", include("apps.products.urls.products")),
    path("api/categories/", include("apps.products.urls.categories")),
    path("api/collections/", include("apps.collections.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/coupons/", include("apps.coupons.urls")),
    path("api/shipping/", include("apps.shipping.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payment/", include("apps.payments.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/manage/", include("apps.manage.urls")),
    path("api/", include("apps.core.urls")),
    # Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "SKIWAA Admin"
admin.site.site_title = "SKIWAA"
admin.site.index_title = "Wear Your Energy — Store Management"
