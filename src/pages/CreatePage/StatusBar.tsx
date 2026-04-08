import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player-store";
import clsx from "clsx";

interface StatusBarProps {
  hasDraft: boolean;
}

export function StatusBar({ hasDraft }: StatusBarProps) {
  const { t } = useTranslation();
  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const isActive = playerState === "playing" || playerState === "paused";

  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t border-gray-200 bg-gray-50/80 px-3 dark:border-gray-800 dark:bg-gray-900/80">
      {/* Draft state */}
      <span
        className={clsx(
          "flex items-center gap-1.5 text-[11px] text-amber-500 transition-opacity dark:text-amber-400",
          hasDraft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {t("create.draftSaved", { defaultValue: "Draft saved" })}
      </span>

      {/* Playback progress */}
      {isActive && (
        <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
          {currentNoteIndex + 1} / {totalNotes}
        </span>
      )}
    </div>
  );
}
