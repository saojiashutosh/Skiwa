"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { TextReveal } from "@/components/motion/text-reveal";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/hooks/queries";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1920&q=80";

export function Hero() {
  const { data: banners } = useBanners("hero");
  const banner = banners?.[0];

  return (
    <section className="relative flex min-h-svh items-end overflow-hidden">
      {/* Cinematic background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={banner?.image || FALLBACK_IMAGE}
          alt="SKIWAA editorial campaign"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* No gradients — a flat cinematic scrim */}
        <div className="absolute inset-0 bg-black/55" />
      </motion.div>

      {/* Copy */}
      <div className="container relative z-10 pb-24 pt-40 md:pb-32">
        <motion.p
          className="label-caps mb-6 text-white/80"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          Est. 2026 — India
        </motion.p>

        <TextReveal
          text={banner?.title || "WEAR YOUR ENERGY"}
          className="heading text-display text-white"
          delay={0.35}
        />

        <motion.p
          className="mt-6 max-w-xl text-sm leading-relaxed text-white/70 md:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          {banner?.subtitle || "Premium streetwear inspired by anime, typography, and art."}
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7 }}
        >
          <Button size="lg" asChild>
            <Link href="/shop">Shop Collection</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-background" asChild>
            <Link href="/collections">Explore Drop</Link>
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        aria-hidden
      >
        <div className="flex flex-col items-center gap-3">
          <span className="label-caps text-white/60">Scroll</span>
          <motion.span
            className="block h-10 w-px bg-white/40"
            animate={{ scaleY: [0.3, 1, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
