import type { Metadata } from "next";

import { CategoryGrid } from "@/components/home/category-grid";
import { CollectionShowcase } from "@/components/home/collection-showcase";
import { FeaturedDrop } from "@/components/home/featured-drop";
import { Hero } from "@/components/home/hero";
import { Marquee } from "@/components/home/marquee";
import { Testimonials } from "@/components/home/testimonials";
import { TrendingRail } from "@/components/home/trending-rail";

export const metadata: Metadata = {
  title: "SKIWAA — Wear Your Energy",
  description:
    "Premium streetwear inspired by anime, typography and art. Oversized tees, hoodies and accessories. Minimal. Bold. Timeless.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedDrop />
      <CategoryGrid />
      <CollectionShowcase />
      <TrendingRail />
      <Testimonials />
    </>
  );
}
