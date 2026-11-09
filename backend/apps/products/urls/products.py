from django.urls import path

from apps.reviews.views import ProductReviewListCreateView

from ..views import FacetView, ProductDetailView, ProductListView, RelatedProductsView

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("facets/", FacetView.as_view(), name="product-facets"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("<slug:slug>/related/", RelatedProductsView.as_view(), name="product-related"),
    path("<slug:slug>/reviews/", ProductReviewListCreateView.as_view(), name="product-reviews"),
]
