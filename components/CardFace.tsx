import { levelLabel } from "@/lib/client/format";

interface CardFaceProps {
  theme: string | null;
  level: string;
  text: string;
  curveballNo?: number | null;
}

export function CardFace({ theme, level, text, curveballNo }: CardFaceProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
        <span className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
          {levelLabel(level)}
        </span>
        {theme && <span>{theme}</span>}
        {curveballNo != null && <span>#{curveballNo}</span>}
      </div>
      <p className="text-lg leading-snug">{text}</p>
    </div>
  );
}
