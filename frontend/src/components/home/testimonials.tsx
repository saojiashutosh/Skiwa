"use client";

import { Reveal } from "@/components/motion/reveal";

const TESTIMONIALS = [
  {
    quote:
      "The heaviest tee I own and somehow the most comfortable. The Shadow Walker print gets me stopped on the street.",
    name: "Arjun M.",
    city: "Mumbai",
  },
  {
    quote:
      "Feels like Fear of God quality at an Indian price point. The Neo Tokyo hoodie is unreal under streetlights.",
    name: "Sana K.",
    city: "Bengaluru",
  },
  {
    quote:
      "Finally a brand that gets anime culture without being cringe about it. Minimal, clean, heavy. I'm collecting every drop.",
    name: "Rehan D.",
    city: "Delhi",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="container">
        <Reveal>
          <p className="label-caps mb-4">The Community</p>
          <h2 className="heading text-section-title text-foreground">Worn Loud</h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 0.1} className="bg-background">
              <figure className="flex h-full flex-col justify-between p-8 md:p-10">
                <blockquote className="text-sm leading-relaxed text-foreground/90">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-8">
                  <p className="font-button text-xs uppercase tracking-[0.2em] text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{testimonial.city}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
