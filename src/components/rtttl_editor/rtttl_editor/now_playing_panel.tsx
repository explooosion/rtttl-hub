import { useTranslation } from "react-i18next";
import clsx from "clsx";

import type { RtttlEntry } from "../../../utils/rtttl_parser";

interface NowPlayingPanelProps {
  currentItem: RtttlEntry | null;
}

export function NowPlayingPanel({ currentItem }: NowPlayingPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-3">
      <h3 className="mb-1 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
        {t("player.nowPlaying")}
      </h3>
      <p
        className={clsx(
          "truncate font-medium",
          currentItem ? "text-gray-900 dark:text-white" : "italic text-gray-400 dark:text-gray-600",
        )}
      >
        {currentItem ? currentItem.title : "—"}
      </p>
      <p
        className={clsx(
          "truncate text-sm text-gray-500 dark:text-gray-400",
          !currentItem?.artist && "invisible",
        )}
      >
        {currentItem?.artist ?? "placeholder"}
      </p>
    </div>
  );
}
