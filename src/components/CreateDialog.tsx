import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCollectionStore } from "@/stores/collection-store";
import { usePlayerStore } from "@/stores/player-store";
import { useCreateDialogStore } from "@/stores/create-dialog-store";
import { useEditorSettingsStore } from "@/stores/editor-settings-store";
import { parseRtttl } from "@/utils/rtttl-parser";
import type { RtttlCategory } from "@/utils/rtttl-parser";
import { RTTTL_CATEGORIES } from "@/constants/categories";
import { FaTimes, FaPlay, FaPause, FaStop } from "react-icons/fa";
import { Waveform } from "./Waveform";
import { RtttlEditorInput } from "./RtttlEditor/RtttlEditorInput";
import { EscOutputPanel } from "./RtttlEditor/MultiTrackPanel";
import clsx from "clsx";

const DRAFT_KEY = "rtttl-hub:create-draft";

interface Draft {
  name: string;
  code: string;
  category: RtttlCategory | "";
  isMultiTrack?: boolean;
  tracks?: string[];
}

function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function CreateDialog() {
  const { t } = useTranslation();
  const isOpen = useCreateDialogStore((s) => s.isOpen);
  const closeDialog = useCreateDialogStore((s) => s.close);

  const addUserItem = useCollectionStore((s) => s.addUserItem);
  const setCurrentItem = usePlayerStore((s) => s.setCurrentItem);
  const playCode = usePlayerStore((s) => s.playCode);
  const playTracks = usePlayerStore((s) => s.playTracks);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const playerState = usePlayerStore((s) => s.playerState);
  const currentNoteIndex = usePlayerStore((s) => s.currentNoteIndex);
  const totalNotes = usePlayerStore((s) => s.totalNotes);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const editorMode = useEditorSettingsStore((s) => s.mode);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<RtttlCategory | "">("");
  const [errors, setErrors] = useState<string[]>([]);

  // Multi-track state
  const [isMultiTrack, setIsMultiTrack] = useState(false);
  const [tracks, setTracks] = useState<string[]>([""]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  const isPreviewActive = playerState === "playing" || playerState === "paused";
  const isCodeValid = code.trim().length > 0 && parseRtttl(code.trim()) !== null;
  const hasDraft = name.trim().length > 0 || code.trim().length > 0;

  // The code currently displayed in the editor (respects active track)
  // When "All" tab is selected (activeTrackIndex === -1), show track 0
  const activeEditIdx = isMultiTrack && activeTrackIndex >= 0 ? activeTrackIndex : 0;
  const displayedCode = isMultiTrack ? (tracks[activeEditIdx] ?? "") : code;

  // Load draft values whenever dialog opens
  useEffect(
    function initializeWhenOpen() {
      if (!isOpen) {
        return;
      }
      const draft = loadDraft();
      if (draft) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(draft.name);
        setCode(draft.code);
        setCategory(draft.category);
        if (draft.isMultiTrack && draft.tracks && draft.tracks.length > 0) {
          setIsMultiTrack(true);
          setTracks(draft.tracks);
          setActiveTrackIndex(draft.tracks.length > 1 ? -1 : 0);
        } else {
          setIsMultiTrack(false);
          setTracks([""]);
          setActiveTrackIndex(0);
        }
      } else {
        setName("");
        setCode("");
        setCategory("");
        setIsMultiTrack(false);
        setTracks([""]);
        setActiveTrackIndex(0);
      }
      setErrors([]);
    },
    [isOpen],
  );

  // Auto-save draft on every keystroke
  useEffect(
    function saveDraftWhenChange() {
      if (!isOpen) {
        return;
      }
      saveDraft({ name, code, category, isMultiTrack, tracks });
    },
    [name, code, category, isMultiTrack, tracks, isOpen],
  );

  // In structured mode, sync the dialog's name from the code's first segment
  useEffect(
    function syncNameFromStructuredMode() {
      if (editorMode !== "structured" || !code) {
        return;
      }
      const seg = code.split(":")[0]?.trim();
      if (seg) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(seg);
      }
    },
    [code, editorMode],
  );

  function handleCodeChange(newCode: string) {
    if (isMultiTrack) {
      const next = [...tracks];
      next[activeEditIdx] = newCode;
      setTracks(next);
      // Keep `code` in sync with track 0 for validation / Waveform preview
      if (activeEditIdx === 0) {
        setCode(newCode);
      }
    } else {
      setCode(newCode);
    }
  }

  const handleAddTrack = useCallback(() => {
    if (tracks.length >= 4) {
      return;
    }
    const next = [...tracks, ""];
    setTracks(next);
    setActiveTrackIndex(next.length - 1);
  }, [tracks]);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      if (tracks.length <= 1) {
        return;
      }
      const next = [...tracks];
      next.splice(index, 1);
      setTracks(next);
      // Fall back to All (-1) when the active track is removed or only 1 track remains
      const newActive =
        activeTrackIndex === -1 ? -1 : activeTrackIndex >= index ? -1 : activeTrackIndex;
      setActiveTrackIndex(next.length > 1 ? newActive : 0);
      if (next.length > 0) {
        setCode(next[0]);
      }
    },
    [tracks, activeTrackIndex],
  );

  function handleToggleMultiTrack() {
    if (isMultiTrack) {
      // Switch OFF: collapse to single-track, keep first track as code
      setIsMultiTrack(false);
      setCode(tracks[0] ?? "");
      setActiveTrackIndex(0);
    } else {
      // Switch ON: promote current code to track 1, select All tab
      setIsMultiTrack(true);
      setTracks([code]);
      setActiveTrackIndex(0);
    }
  }

  function handlePlayToggle() {
    if (playerState === "playing") {
      pause();
    } else if (playerState === "paused") {
      resume();
    } else if (isMultiTrack && tracks.length > 1 && activeTrackIndex < 0) {
      // All tab selected: play all tracks
      playTracks(tracks);
    } else if (isMultiTrack) {
      // Specific track selected or only 1 track
      playCode(tracks[activeEditIdx]?.trim() ?? "");
    } else {
      playCode(code.trim());
    }
  }

  function handleSubmit() {
    const newErrors: string[] = [];
    if (!name.trim()) {
      newErrors.push(t("create.nameRequired"));
    }
    const primaryCode = isMultiTrack ? (tracks[0] ?? "") : code.trim();
    if (!primaryCode.trim() || !parseRtttl(primaryCode.trim())) {
      newErrors.push(t("create.invalidCode"));
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const firstLetter = name.charAt(0).toUpperCase();
    const id = `user-${crypto.randomUUID()}`;
    const nonEmptyTracks = isMultiTrack ? tracks.filter((tk) => tk.trim().length > 0) : undefined;

    const newItem = {
      id,
      artist: "",
      title: name.trim(),
      firstLetter: /[A-Z]/.test(firstLetter)
        ? firstLetter
        : /[0-9]/.test(firstLetter)
          ? "0-9"
          : "#",
      code: primaryCode.trim(),
      collection: "community" as const,
      category: category || undefined,
      createdAt: new Date().toISOString(),
      ...(nonEmptyTracks && nonEmptyTracks.length > 1 ? { tracks: nonEmptyTracks } : {}),
    };

    addUserItem(newItem);
    setCurrentItem(newItem);
    clearDraft();
    stop();
    closeDialog();
  }

  // X icon / Cancel: discard draft and close
  function handleDiscard() {
    stop();
    clearDraft();
    setName("");
    setCode("");
    setCategory("");
    setIsMultiTrack(false);
    setTracks([""]);
    setActiveTrackIndex(0);
    setErrors([]);
    closeDialog();
  }

  // Backdrop / Escape: preserve draft, just close
  function handleDismiss() {
    stop();
    closeDialog();
  }

  return (
    <Dialog open={isOpen} onClose={handleDismiss} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
          {/* Fixed header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("create.title")}
            </DialogTitle>
            <button
              onClick={handleDiscard}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              {t("create.localStorageHint")}
            </p>

            {errors.length > 0 && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                {errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {/* Name + Category — same row (name hidden in structured mode, handled by editor) */}
              <div
                className={clsx(
                  "grid gap-3",
                  editorMode === "raw" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
                )}
              >
                {editorMode === "raw" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("create.name")}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("create.namePlaceholder")}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("create.category")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RtttlCategory | "")}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="">{t("create.categoryPlaceholder")}</option>
                    {RTTTL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`categories.${cat}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Waveform preview + play controls (shown when code is valid) */}
              {isCodeValid && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <Waveform
                    code={code.trim()}
                    currentNoteIndex={isPreviewActive ? currentNoteIndex : 0}
                    totalNotes={isPreviewActive ? totalNotes : 0}
                    isPlaying={isPreviewActive}
                    onSeek={isPreviewActive ? seekTo : undefined}
                    height={48}
                    barCount={60}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePlayToggle}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white",
                        playerState === "playing"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-indigo-600 hover:bg-indigo-700",
                      )}
                    >
                      {playerState === "playing" ? (
                        <>
                          <FaPause size={14} />
                          {t("player.pause")}
                        </>
                      ) : playerState === "paused" ? (
                        <>
                          <FaPlay size={14} />
                          {t("player.resume")}
                        </>
                      ) : (
                        <>
                          <FaPlay size={14} />
                          {t("player.play")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={stop}
                      disabled={!isPreviewActive}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <FaStop size={14} />
                      {t("player.stop")}
                    </button>
                    <span
                      className={clsx(
                        "ml-auto text-xs text-gray-400 dark:text-gray-500",
                        !isPreviewActive && "invisible",
                      )}
                    >
                      {t("player.note", { current: currentNoteIndex + 1, total: totalNotes })}
                    </span>
                  </div>
                </div>
              )}

              {/* RTTTL Editor panel (matches community page style) */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                    {t("editor.title")}
                  </h3>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={isMultiTrack}
                      onChange={handleToggleMultiTrack}
                      className="h-3.5 w-3.5 rounded accent-indigo-600"
                    />
                    {t("create.multiTrack", { defaultValue: "Multi-Motor" })}
                  </label>
                </div>
                <RtttlEditorInput
                  value={displayedCode}
                  onChange={handleCodeChange}
                  {...(isMultiTrack
                    ? {
                        tracks,
                        activeTrackIndex,
                        onSelectTrack: setActiveTrackIndex,
                        onAddTrack: handleAddTrack,
                        onRemoveTrack: handleRemoveTrack,
                      }
                    : {})}
                />
              </div>

              {/* ESC motor output — shown in multi-track mode */}
              {isMultiTrack && tracks.length > 0 && <EscOutputPanel tracks={tracks} />}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <span
              className={clsx(
                "text-xs text-amber-500 transition-opacity",
                hasDraft ? "opacity-100" : "opacity-0",
              )}
            >
              {t("create.draftSaved")}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t("create.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {t("create.create")}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
