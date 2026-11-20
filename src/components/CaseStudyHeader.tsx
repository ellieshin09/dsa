interface CaseStudyHeaderProps {
  kicker: string;
  title: string;
  description?: string;
}

export default function CaseStudyHeader({ kicker, title, description }: CaseStudyHeaderProps) {
  return (
    <div className="mb-6 pb-5 border-b border-[#121212]">
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-block w-3 h-3 bg-[#D9531E] shrink-0" aria-hidden="true" />
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#111111]">
          {kicker}
        </p>
      </div>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-tight text-[#111111] text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm sm:text-base text-[#111111]/80 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
