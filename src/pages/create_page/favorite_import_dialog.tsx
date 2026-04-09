import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { useCollectionStore } from "@/stores/collection_store";
import { useFavoritesStore } from "@/stores/favorites_store";
import { TRACK_DOT_CLASSES } from "./constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (tracks: string[]) => void;
}

export function FavoriteImportDialog({ open, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);

  const favorites = [...items, ...userItems].filter((item) => favoriteIds.includes(item.id));

  function handleSelect(tracks: string[]) {
    onConfirm(tracks);
    onClose();
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
              {t("create.importFromFavoritesTitle", {
                defaultValue: "Import from Favorites",
              })}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            {favorites.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("create.noFavorites", { defaultValue: "No favorites yet." })}
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {favorites.map((item, idx) => {
                  const tracks = item.tracks ?? [item.code];
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(tracks)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${TRACK_DOT_CLASSES[idx % TRACK_DOT_CLASSES.length]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.title}
                        </p>
                        {item.tracks && item.tracks.length > 1 && (
                          <p className="text-xs text-gray-400">
                            {item.tracks.length} {t("create.tracks", { defaultValue: "tracks" })}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-700">
            <button
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
