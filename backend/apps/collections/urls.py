from django.urls import path

from .views import CollectionDetailView, CollectionListView

urlpatterns = [
    path("", CollectionListView.as_view(), name="collection-list"),
    path("<slug:slug>/", CollectionDetailView.as_view(), name="collection-detail"),
]
