import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of SKIWAA — premium streetwear born in India, inspired by anime, typography and art.",
};

const VALUES = [
  {
    title: "Minimal",
    body: "We strip everything to its essence. No noise, no filler graphics, no trend-chasing. What remains is intention.",
  },
  {
    title: "Bold",
    body: "240 GSM fabric. Typography you can read from across the street. Prints that commit. If it doesn't make a statement, it doesn't ship.",
  },
  {
    title: "Timeless",
    body: "Drops sell out and never return, but every piece is designed to be worn for years — not seasons.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24">
      {/* Manifesto hero */}
      <section className="container pt-40 md:pt-52">
        <Reveal>
          <p className="label-caps mb-6">The Story</p>
          <h1 className="heading max-w-5xl text-section-title text-foreground">
            Born from anime nights, type specimens and the streets of India.
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            SKIWAA started in 2026 with a simple frustration: streetwear in India was either
            imported at luxury prices or printed without love. We wanted heavyweight fabric,
            editorial design, and stories worth wearing — so we built it ourselves.
          </p>
        </Reveal>
      </section>

      {/* Editorial image */}
      <section className="container mt-20">
        <Parallax amount={50}>
          <div className="relative aspect-[21/9] overflow-hidden bg-muted">
            <Image
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1920&q=80"
              alt="The SKIWAA studio"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Parallax>
      </section>

      {/* Values */}
      <section className="container mt-24 md:mt-32">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.1} className="bg-background">
              <div className="p-10 md:p-12">
                <p className="heading text-5xl text-foreground/15">0{index + 1}</p>
                <h2 className="heading mt-4 text-3xl text-foreground">{value.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="container mt-24 grid gap-12 md:mt-32 md:grid-cols-2 md:items-center">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <Image
              src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80"
              alt="SKIWAA editorial photography"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="label-caps mb-4 text-accent">Why &ldquo;Wear Your Energy&rdquo;</p>
          <h2 className="heading text-4xl text-foreground md:text-6xl">
            Clothing is the loudest silent language.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            Every SKIWAA drop borrows from the stories that raised us — masterless ronin, neon
            megacities, spirits in the dark. We translate them into typography and silhouettes you
            can live in. When you wear a drop, you carry its energy. That&apos;s the whole idea.
          </p>
          <Button className="mt-10" size="lg" asChild>
            <Link href="/collections">Explore the Drops</Link>
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
