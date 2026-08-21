import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { FaTimes, FaSpinner, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

import { useAuthStore } from "../../stores/auth_store";
import { ConfirmDialog } from "../../components/confirm_dialog";
import {
  getUserRecognitions,
  deleteAudioRecognition,
} from "../../services/audio_recognition_service";
import type { FirestoreAudioRecognition } from "../../services/audio_recognition_service";

interface RecognitionHistoryDialogProps {
  open: boolean;
  onClose: VoidFunction;
  onImport: (rtttlList: string[]) => void;
}

function formatDate(ts: { toDate: () => Date }): string {
  const d = ts.toDate();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecognitionHistoryDialog({
  open,
  onClose,
  onImport,
}: RecognitionHistoryDialogProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const [records, setRecords] = useState<FirestoreAudioRecognition[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadRecords = useCallback(
    async function loadRecords() {
      if (!user) {
        return;
      }
      setLoading(true);
      try {
        const data = await getUserRecognitions(user.uid);
        setRecords(data);
      } catch {
        toast.error("Failed to load recognition history.");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  function handleAfterEnter() {
    void loadRecords();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteAudioRecognition(deleteTarget);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget));
      toast.success(
        t("audioExtract.recordDeleted", { defaultValue: "Recognition record deleted." }),
      );
    } catch {
      toast.error("Failed to delete record.");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleImportRecord(record: FirestoreAudioRecognition) {
    const rtttlList = record.tracks.filter((tr) => tr.noteCount > 0).map((tr) => tr.rtttl);

    if (rtttlList.length === 0) {
      toast.error(t("audioExtract.noTracksSelected", { defaultValue: "No tracks with notes." }));
      return;
    }

    onImport(rtttlList);
    onClose();
    toast.success(
      t("audioExtract.importSuccess", {
        defaultValue: "{{count}} track(s) imported.",
        count: rtttlList.length,
      }),
    );
  }

  return (
    <>
      <Transition show={open} afterEnter={handleAfterEnter}>
        <Dialog onClose={onClose} className="relative z-50">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="flex w-full max-w-lg flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
                  <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                    {t("audioExtract.historyTitle", { defaultValue: "Recognition History" })}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <FaSpinner size={20} className="animate-spin text-indigo-500" />
                    </div>
                  )}

                  {!loading && records.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                      {t("audioExtract.noHistory", { defaultValue: "No recognition history yet." })}
                    </p>
                  )}

                  {!loading && records.length > 0 && (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          <th className="pb-2 font-medium">
                            {t("audioExtract.colFileName", { defaultValue: "File" })}
                          </th>
                          <th className="pb-2 font-medium">
                            {t("audioExtract.colStems", { defaultValue: "Stems" })}
                          </th>
                          <th className="pb-2 font-medium">
                            {t("audioExtract.colDate", { defaultValue: "Date" })}
                          </th>
                          <th className="pb-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr
                            key={record.id}
                            className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                            onClick={() => handleImportRecord(record)}
                          >
                            <td className="max-w-[140px] truncate py-2.5 pr-2 font-medium text-gray-900 dark:text-white">
                              {record.fileName}
                            </td>
                            <td className="py-2.5 pr-2 text-gray-500 dark:text-gray-400">
                              {record.tracks.filter((tr) => tr.noteCount > 0).length}/
                              {record.tracks.length}
                            </td>
                            <td className="py-2.5 pr-2 text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(record.createdAt)}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(record.id);
                                }}
                                className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                                title={t("audioExtract.deleteRecord", {
                                  defaultValue: "Delete Record",
                                })}
                              >
                                <FaTrash size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={t("audioExtract.deleteConfirmTitle", { defaultValue: "Delete Recognition Record" })}
        message={t("audioExtract.deleteConfirmMessage", {
          defaultValue:
            "Are you sure you want to delete this record? This action cannot be undone.",
        })}
        confirmLabel={t("actions.delete", { defaultValue: "Delete" })}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
