import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../stores/auth_store";
import { ConfirmDialog } from "../../components/confirm_dialog";
import { ImportDialog } from "./import_dialog";
import { FavoriteImportDialog } from "./favorite_import_dialog";
import { CutDialog } from "./cut_dialog";
import { HelpDialog } from "./transport_toolbar/help_dialog";
import { CreateSummaryModal } from "./create_summary_modal";
import type { CutMode } from "./cut_dialog";
import type { RtttlCategory } from "../../utils/rtttl_parser";

interface CreatePageDialogsProps {
  importOpen: boolean;
  favImportOpen: boolean;
  helpOpen: boolean;
  cutDialogMode: CutMode | null;
  confirmRemoveIndex: number | null;
  pendingAction: "new" | "discard" | null;
  createSummaryOpen: boolean;
  tracks: string[];
  trackColors: string[];
  loopInMs: number | null;
  loopOutMs: number | null;
  name: string;
  categories: RtttlCategory[];
  isPublic: boolean;
  onImportClose: VoidFunction;
  onImportConfirm: (parsed: string[]) => void;
  onFavImportClose: VoidFunction;
  onHelpClose: VoidFunction;
  onCutConfirm: (selectedIndices: number[], mode: CutMode | null) => void;
  onCutCancel: VoidFunction;
  onConfirmRemove: (index: number | null) => void;
  onCancelRemove: VoidFunction;
  onPendingActionConfirm: (action: "new" | "discard" | null) => void;
  onPendingActionCancel: VoidFunction;
  onCreateSummaryConfirm: VoidFunction;
  onCreateSummaryCancel: VoidFunction;
  onNameChange: (v: string) => void;
  onRenameTrack: (idx: number, newName: string) => void;
  onIsPublicChange: (v: boolean) => void;
}

export function CreatePageDialogs({
  importOpen,
  favImportOpen,
  helpOpen,
  cutDialogMode,
  confirmRemoveIndex,
  pendingAction,
  createSummaryOpen,
  tracks,
  trackColors,
  loopInMs,
  loopOutMs,
  name,
  categories,
  isPublic,
  onImportClose,
  onImportConfirm,
  onFavImportClose,
  onHelpClose,
  onCutConfirm,
  onCutCancel,
  onConfirmRemove,
  onCancelRemove,
  onPendingActionConfirm,
  onPendingActionCancel,
  onCreateSummaryConfirm,
  onCreateSummaryCancel,
  onNameChange,
  onRenameTrack,
  onIsPublicChange,
}: CreatePageDialogsProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const removeTrackMessage = useMemo(
    function buildRemoveTrackMessage() {
      const idx = confirmRemoveIndex ?? 0;
      const code = tracks[idx] ?? "";
      const colonIdx = code.indexOf(":");
      const trackName = (colonIdx > 0 ? code.slice(0, colonIdx).trim() : "") || `Track ${idx + 1}`;
      return t("editor.removeTrackConfirm", {
        defaultValue: 'Are you sure you want to remove track "{{name}}"?',
        name: trackName,
      });
    },
    [confirmRemoveIndex, tracks, t],
  );

  const handleConfirmRemove = useCallback(
    function handleConfirmRemove() {
      onConfirmRemove(confirmRemoveIndex);
    },
    [onConfirmRemove, confirmRemoveIndex],
  );

  const handlePendingActionConfirm = useCallback(
    function handlePendingActionConfirm() {
      onPendingActionConfirm(pendingAction);
    },
    [onPendingActionConfirm, pendingAction],
  );

  const handleCutConfirm = useCallback(
    function handleCutConfirm(selectedIndices: number[]) {
      onCutConfirm(selectedIndices, cutDialogMode);
    },
    [onCutConfirm, cutDialogMode],
  );

  return (
    <>
      <ImportDialog open={importOpen} onClose={onImportClose} onConfirm={onImportConfirm} />

      <HelpDialog open={helpOpen} onClose={onHelpClose} />

      <FavoriteImportDialog
        open={favImportOpen}
        onClose={onFavImportClose}
        onConfirm={onImportConfirm}
      />

      <ConfirmDialog
        isOpen={confirmRemoveIndex !== null}
        title={t("editor.removeTrack", { defaultValue: "Remove Track" })}
        message={removeTrackMessage}
        confirmLabel={t("editor.removeTrack", { defaultValue: "Remove" })}
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={onCancelRemove}
      />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction === "new"
            ? t("create.menuNew", { defaultValue: "New Project" })
            : t("create.cancel", { defaultValue: "Discard" })
        }
        message={
          pendingAction === "new"
            ? t("create.newProjectConfirm", {
                defaultValue:
                  "You have unsaved track data. Create a new project and discard current data?",
              })
            : t("create.discardConfirm", { defaultValue: "Discard current edits and exit?" })
        }
        confirmLabel={t("confirm.ok", { defaultValue: "Yes" })}
        onConfirm={handlePendingActionConfirm}
        onCancel={onPendingActionCancel}
      />

      <CutDialog
        mode={cutDialogMode ?? "trim"}
        open={cutDialogMode !== null}
        tracks={tracks}
        trackColors={trackColors}
        inMs={loopInMs}
        outMs={loopOutMs}
        onConfirm={handleCutConfirm}
        onCancel={onCutCancel}
      />

      <CreateSummaryModal
        isOpen={createSummaryOpen}
        name={name}
        categories={categories}
        tracks={tracks}
        isPublic={isPublic}
        isLoggedIn={!!user}
        onConfirm={onCreateSummaryConfirm}
        onCancel={onCreateSummaryCancel}
        onNameChange={onNameChange}
        onRenameTrack={onRenameTrack}
        onIsPublicChange={onIsPublicChange}
      />
    </>
  );
}
