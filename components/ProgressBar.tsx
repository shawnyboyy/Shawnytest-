import { levelLabel } from "@/lib/client/format";
import type { RoomStateDTO } from "@/lib/client/api";

const LEVELS = ["WARMUP", "REAL_TALK", "GO_DEEP"] as const;

interface ProgressBarProps {
  currentLevel: RoomStateDTO["currentLevel"];
  poolCounts: RoomStateDTO["poolCounts"];
  weekNumber: number;
}

export function ProgressBar({ currentLevel, poolCounts, weekNumber }: ProgressBarProps) {
  const currentIndex = LEVELS.indexOf(currentLevel);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
        <span>Week {weekNumber}</span>
        <span>{poolCounts.curveball} curveballs left</span>
      </div>
      <div className="mt-2 flex gap-2">
        {LEVELS.map((level, i) => (
          <div
            key={level}
            className={`flex-1 rounded-md border px-2 py-1.5 text-center text-xs font-medium ${
              i === currentIndex
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : i < currentIndex
                  ? "border-black/20 bg-black/5 text-black/40 dark:border-white/20 dark:bg-white/10 dark:text-white/40"
                  : "border-black/10 text-black/40 dark:border-white/10 dark:text-white/40"
            }`}
          >
            {levelLabel(level)}
          </div>
        ))}
      </div>
    </div>
  );
}
