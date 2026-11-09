"""
Seed the store with the SKIWAA launch catalog.

Idempotent — safe to run repeatedly. Usage:
    python manage.py seed_demo
"""
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.collections.models import Collection
from apps.core.models import Banner, PageCopy
from apps.coupons.models import Coupon
from apps.products.models import Category, Color, Inventory, Product, ProductImage, Size, Variant
from apps.shipping.models import ShippingMethod

U = "https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w=1200&q=80"


def img(photo_id: str) -> str:
    return U.format(id=photo_id)


COLLECTIONS = [
    {
        "drop_number": "DROP 001",
        "name": "Shadows & Souls",
        "tagline": "Born in the dark. Worn in the light.",
        "description": (
            "Our debut drop. Heavyweight silhouettes drenched in black, cut with "
            "brutal typography and hand-drawn spirit motifs. Every piece is a "
            "shadow you choose to wear."
        ),
        "release_date": date(2026, 1, 15),
        "is_featured": True,
        "image": img("1523398002811-999ca8dec234"),
    },
    {
        "drop_number": "DROP 002",
        "name": "Neo Tokyo",
        "tagline": "The future wears red.",
        "description": (
            "A love letter to anime's neon dystopias. Oversized fits, katakana "
            "prints, and accents of signal red — streetwear for the year 2099."
        ),
        "release_date": date(2026, 4, 2),
        "is_featured": False,
        "image": img("1503342217505-b0a15ec3261c"),
    },
    {
        "drop_number": "DROP 003",
        "name": "Ronin",
        "tagline": "No master. All honor.",
        "description": (
            "Wanderer energy. Washed blacks, brushstroke calligraphy, and "
            "armor-inspired paneling. For the ones who walk their own path."
        ),
        "release_date": date(2026, 7, 1),
        "is_featured": False,
        "image": img("1493655161922-ef98929de9d8"),
    },
]

CATEGORIES = [
    {"name": "Oversized Tees", "description": "Heavyweight 240 GSM oversized tees.", "image": img("1576566588028-4147f3842f27"), "sort_order": 1},
    {"name": "Oversized Hoodies", "description": "450 GSM fleece-backed oversized hoodies.", "image": img("1556821840-3a63f95609a7"), "sort_order": 2},
    {"name": "Accessories", "description": "Caps, totes and everything else.", "image": img("1521369909029-2afed882baee"), "sort_order": 3},
]

COLORS = [
    {"name": "Jet Black", "hex_code": "#0B0B0B"},
    {"name": "Bone White", "hex_code": "#F5F5F5"},
    {"name": "Blood Red", "hex_code": "#C1121F"},
    {"name": "Ash Grey", "hex_code": "#8A8A8A"},
]

SIZES = [
    {"name": "S", "label": "Small", "sort_order": 1},
    {"name": "M", "label": "Medium", "sort_order": 2},
    {"name": "L", "label": "Large", "sort_order": 3},
    {"name": "XL", "label": "Extra Large", "sort_order": 4},
    {"name": "XXL", "label": "Double XL", "sort_order": 5},
    {"name": "OS", "label": "One Size", "sort_order": 6},
]

PRODUCTS = [
    # ── DROP 001 · Shadows & Souls ──
    {
        "name": "Shadow Walker Oversized Tee", "category": "Oversized Tees", "collection": "Shadows & Souls",
        "price": "1499", "compare_at_price": "1999",
        "description": "A 240 GSM heavyweight tee with a hand-inked wraith motif across the back and SKIWAA katakana at the chest. Drop shoulders, boxy fit, zero compromise.",
        "featured": True, "new": True, "trending": True,
        "colors": ["Jet Black", "Bone White"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "images": [img("1576566588028-4147f3842f27"), img("1583743814966-8936f5b7be1a")],
    },
    {
        "name": "Souls Bound Oversized Tee", "category": "Oversized Tees", "collection": "Shadows & Souls",
        "price": "1399",
        "description": "Twin spirits in brushstroke white on washed black. Garment-dyed for a lived-in soul, ribbed collar that never loses shape.",
        "featured": True, "new": False, "trending": False,
        "colors": ["Jet Black"], "sizes": ["S", "M", "L", "XL"],
        "images": [img("1503341504253-dff4815485f1"), img("1571945153237-4929e783af4a")],
    },
    {
        "name": "Phantom Oversized Hoodie", "category": "Oversized Hoodies", "collection": "Shadows & Souls",
        "price": "2999", "compare_at_price": "3499",
        "description": "450 GSM fleece-backed hoodie with a phantom silhouette print, tonal embroidery, and a double-layered hood that stands like armor.",
        "featured": True, "new": True, "trending": True,
        "colors": ["Jet Black", "Ash Grey"], "sizes": ["M", "L", "XL", "XXL"],
        "images": [img("1556821840-3a63f95609a7"), img("1509942774463-acf339cf87d5")],
    },
    {
        "name": "Afterlife Snapback", "category": "Accessories", "collection": "Shadows & Souls",
        "price": "899",
        "description": "Structured 6-panel snapback in jet black with a blood-red soul sigil embroidered at the front.",
        "featured": False, "new": False, "trending": False,
        "colors": ["Jet Black"], "sizes": ["OS"],
        "images": [img("1521369909029-2afed882baee"), img("1588850561407-ed78c282e89b")],
    },
    # ── DROP 002 · Neo Tokyo ──
    {
        "name": "Neo Tokyo Racer Tee", "category": "Oversized Tees", "collection": "Neo Tokyo",
        "price": "1599",
        "description": "Cyber-grid graphics with katakana taillights. An oversized racer tee straight out of a neon expressway at 3 AM.",
        "featured": True, "new": True, "trending": True,
        "colors": ["Jet Black", "Blood Red"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "images": [img("1503342217505-b0a15ec3261c"), img("1515886657613-9f3515b0c78f")],
    },
    {
        "name": "2099 District Oversized Tee", "category": "Oversized Tees", "collection": "Neo Tokyo",
        "price": "1499",
        "description": "District 2099 typography stacked down the spine. Bone-white body with signal-red hits.",
        "featured": False, "new": True, "trending": False,
        "colors": ["Bone White"], "sizes": ["S", "M", "L", "XL"],
        "images": [img("1521572163474-6864f9cf17ab"), img("1503341455253-b2e723bb3dbb")],
    },
    {
        "name": "Akira Static Hoodie", "category": "Oversized Hoodies", "collection": "Neo Tokyo",
        "price": "3199", "compare_at_price": "3799",
        "description": "Glitch-print hoodie with a padded kangaroo pocket and reflective piping that ignites under headlights.",
        "featured": True, "new": True, "trending": False,
        "colors": ["Jet Black", "Blood Red"], "sizes": ["M", "L", "XL"],
        "images": [img("1578681994506-b8f463449011"), img("1620799140408-edc6dcb6d633")],
    },
    {
        "name": "Neon Alley Tote", "category": "Accessories", "collection": "Neo Tokyo",
        "price": "1099",
        "description": "Heavy canvas tote with a screen-printed neon alley scene. Carries your world through the megacity.",
        "featured": False, "new": False, "trending": True,
        "colors": ["Jet Black"], "sizes": ["OS"],
        "images": [img("1544816155-12df9643f363"), img("1591561954557-26941169b49e")],
    },
    # ── DROP 003 · Ronin ──
    {
        "name": "Masterless Oversized Tee", "category": "Oversized Tees", "collection": "Ronin",
        "price": "1499",
        "description": "Brushstroke ronin calligraphy in bone white over a washed-black body. Walk alone, walk loud.",
        "featured": False, "new": True, "trending": True,
        "colors": ["Jet Black", "Ash Grey"], "sizes": ["S", "M", "L", "XL", "XXL"],
        "images": [img("1493655161922-ef98929de9d8"), img("1529374255404-311a2a4f1fd9")],
    },
    {
        "name": "Wanderer Panel Hoodie", "category": "Oversized Hoodies", "collection": "Ronin",
        "price": "3299",
        "description": "Armor-inspired paneling, drop shoulders, and a storm flap hood. Built like protection, worn like intent.",
        "featured": True, "new": True, "trending": False,
        "colors": ["Jet Black", "Ash Grey"], "sizes": ["M", "L", "XL", "XXL"],
        "images": [img("1509942774463-acf339cf87d5"), img("1556821840-3a63f95609a7")],
    },
    {
        "name": "Honor Bound Cap", "category": "Accessories", "collection": "Ronin",
        "price": "999",
        "description": "Washed cotton cap with a minimal blade-stroke embroidery. Quiet piece, loud meaning.",
        "featured": False, "new": False, "trending": False,
        "colors": ["Ash Grey"], "sizes": ["OS"],
        "images": [img("1588850561407-ed78c282e89b"), img("1521369909029-2afed882baee")],
    },
    {
        "name": "Path of One Oversized Tee", "category": "Oversized Tees", "collection": "Ronin",
        "price": "1599", "compare_at_price": "1899",
        "description": "A single unbroken brushstroke circles the torso — one path, one life. 240 GSM, enzyme-washed.",
        "featured": False, "new": False, "trending": True,
        "colors": ["Bone White", "Jet Black"], "sizes": ["S", "M", "L", "XL"],
        "images": [img("1583743814966-8936f5b7be1a"), img("1576566588028-4147f3842f27")],
    },
]

SHIPPING_METHODS = [
    {"name": "Standard Shipping", "code": "standard", "description": "5–7 business days, tracked.", "price": "99", "free_above": "1999", "eta_days_min": 5, "eta_days_max": 7, "sort_order": 1},
    {"name": "Express Shipping", "code": "express", "description": "2–3 business days, priority.", "price": "249", "free_above": "4999", "eta_days_min": 2, "eta_days_max": 3, "sort_order": 2},
]

COUPONS = [
    {"code": "ENERGY10", "description": "10% off your order", "discount_type": "percent", "value": "10", "min_subtotal": "999", "max_discount": "500"},
    {"code": "FIRSTDROP", "description": "₹300 off orders above ₹2499", "discount_type": "fixed", "value": "300", "min_subtotal": "2499"},
]

PAGE_COPY = [
    {
        "key": "shop",
        "eyebrow": "The Catalog",
        "title": "Shop All",
        "body": "",
    },
    {
        "key": "collections",
        "eyebrow": "The Archive",
        "title": "Collections",
        "body": "Every SKIWAA drop is a chapter — a world built from anime, typography and street energy.",
    },
    {
        "key": "wishlist",
        "eyebrow": "Saved Energy",
        "title": "Wishlist",
        "body": "",
    },
    {
        "key": "search",
        "eyebrow": "Search",
        "title": "Find Your Energy",
        "body": "",
    },
]

BANNERS = [
    {
        "title": "WEAR YOUR ENERGY",
        "subtitle": "Premium streetwear inspired by anime, typography and art.",
        "cta_label": "Shop Collection", "cta_href": "/shop",
        "placement": "hero", "image": img("1523398002811-999ca8dec234"), "sort_order": 1,
    },
    {
        "title": "DROP 001 — SHADOWS & SOULS",
        "subtitle": "Born in the dark. Worn in the light.",
        "cta_label": "Explore Drop", "cta_href": "/collections/shadows-souls",
        "placement": "drop", "image": img("1503341504253-dff4815485f1"), "sort_order": 1,
    },
]


class Command(BaseCommand):
    help = "Seed the SKIWAA demo catalog (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        for data in COLORS:
            Color.objects.update_or_create(name=data["name"], defaults=data)
        for data in SIZES:
            Size.objects.update_or_create(name=data["name"], defaults=data)
        for data in CATEGORIES:
            Category.objects.update_or_create(
                name=data["name"],
                defaults={**{k: v for k, v in data.items() if k != "image"}, "image_url": data["image"]},
            )
        for data in COLLECTIONS:
            Collection.objects.update_or_create(
                name=data["name"],
                defaults={**{k: v for k, v in data.items() if k != "image"}, "image_url": data["image"]},
            )

        for entry in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                name=entry["name"],
                defaults={
                    "category": Category.objects.get(name=entry["category"]),
                    "collection": Collection.objects.get(name=entry["collection"]),
                    "description": entry["description"],
                    "price": Decimal(entry["price"]),
                    "compare_at_price": Decimal(entry["compare_at_price"]) if entry.get("compare_at_price") else None,
                    "is_featured": entry["featured"],
                    "is_new_arrival": entry["new"],
                    "is_trending": entry["trending"],
                },
            )
            for index, url in enumerate(entry["images"]):
                ProductImage.objects.update_or_create(
                    product=product, sort_order=index,
                    defaults={"image_url": url, "alt_text": f"{product.name} — view {index + 1}"},
                )
            sku_base = "".join(word[0] for word in product.name.split()[:3]).upper()
            for color_name in entry["colors"]:
                color = Color.objects.get(name=color_name)
                for size_name in entry["sizes"]:
                    size = Size.objects.get(name=size_name)
                    variant, _ = Variant.objects.update_or_create(
                        product=product, color=color, size=size,
                        defaults={"sku": f"SKW-{sku_base}-{color.slug[:3].upper()}-{size.name}"},
                    )
                    Inventory.objects.get_or_create(variant=variant, defaults={"quantity": 25})

        for data in SHIPPING_METHODS:
            ShippingMethod.objects.update_or_create(
                code=data["code"],
                defaults={**data, "price": Decimal(data["price"]), "free_above": Decimal(data["free_above"])},
            )
        for data in COUPONS:
            Coupon.objects.update_or_create(
                code=data["code"],
                defaults={
                    **data,
                    "value": Decimal(data["value"]),
                    "min_subtotal": Decimal(data["min_subtotal"]),
                    "max_discount": Decimal(data["max_discount"]) if data.get("max_discount") else None,
                },
            )
        for data in BANNERS:
            Banner.objects.update_or_create(
                title=data["title"],
                defaults={**{k: v for k, v in data.items() if k != "image"}, "image_url": data["image"]},
            )
        for data in PAGE_COPY:
            # get_or_create, not update_or_create — never clobber admin edits on reseed.
            PageCopy.objects.get_or_create(key=data["key"], defaults=data)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {Collection.objects.count()} collections, "
            f"{Product.objects.count()} products, "
            f"{Variant.objects.count()} variants."
        ))
