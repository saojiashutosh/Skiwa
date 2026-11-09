const WORDS = ["WEAR YOUR ENERGY", "SKIWAA", "MINIMAL", "BOLD", "TIMELESS", "ドロップ 001"];

export function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden border-y border-border py-5" aria-hidden>
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
        {[0, 1].map((half) => (
          <div key={half} className="flex gap-12">
            {row.map((word, index) => (
              <span
                key={`${half}-${index}`}
                className="font-heading text-2xl uppercase tracking-[0.3em] text-white/25 md:text-3xl"
              >
                {word} <span className="text-accent">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
