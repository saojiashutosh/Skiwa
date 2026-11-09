interface PolicySection {
  heading: string;
  body: string[];
}

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  updated: string;
  sections: PolicySection[];
}

export function PolicyPage({ eyebrow, title, updated, sections }: PolicyPageProps) {
  return (
    <div className="container pb-24 pt-28 md:pt-36">
      <p className="label-caps mb-3">{eyebrow}</p>
      <h1 className="heading text-section-title text-foreground">{title}</h1>
      <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
        Last updated: {updated}
      </p>

      <div className="mt-14 max-w-3xl space-y-12">
        {sections.map((section, index) => (
          <section key={index}>
            <h2 className="heading text-2xl text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, pIndex) => (
              <p key={pIndex} className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
