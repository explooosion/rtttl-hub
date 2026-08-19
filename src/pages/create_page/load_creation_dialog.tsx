import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";

import { useCollectionStore } from "../../stores/collection_store";
import { formatDurationMs, formatShortDate, getRtttlDurationMs } from "../../utils/rtttl_format";

interface Props {
  open: boolean;
  onClose: VoidFunction;
  onConfirm: (tracks: string[]) => void;
}

export function LoadCreationDialog({ open, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const userItems = useCollectionStore((s) => s.userItems);

  const creations = userItems.filter((item) => item.collection === "my-creations");

  function handleSelect(tracks: string[]) {
    onConfirm(tracks);
    onClose();
  }

  function renderItem(item: (typeof creations)[number]) {
    const tracks = item.tracks ?? [item.code];
    const primaryCode = tracks[0] ?? "";
    const durationMs = getRtttlDurationMs(primaryCode);

    function handleItemSelect() {
      handleSelect(tracks);
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={handleItemSelect}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 rounded-lg px-3 py-2.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      >
        {/* Left: name + track count */}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {item.title}
          </p>
          {item.tracks && item.tracks.length > 1 && (
            <p className="text-xs text-gray-400">
              {item.tracks.length} {t("create.tracks", { defaultValue: "tracks" })}
            </p>
          )}
        </div>

        {/* Right: duration + date */}
        <div className="shrink-0 text-right">
          {durationMs !== null && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {formatDurationMs(durationMs)}
            </p>
          )}
          {item.updatedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatShortDate(item.updatedAt)}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="flex w-full max-w-md flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          style={{ maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("create.loadCreationTitle", { defaultValue: "Load My Creation" })}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Column headers */}
          {creations.length > 0 && (
            <div className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-gray-100 px-3 py-1.5 dark:border-gray-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t("create.colName", { defaultValue: "Name" })}
              </span>
              <span className="shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {t("create.colDuration", { defaultValue: "Duration" })} /{" "}
                {t("create.colEdited", { defaultValue: "Edited" })}
              </span>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            {creations.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("create.noCreations", { defaultValue: "No creations yet." })}
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">{creations.map(renderItem)}</div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t("confirm.cancel", { defaultValue: "Cancel" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
