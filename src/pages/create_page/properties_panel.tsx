import { useRef, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck, FaChevronDown } from "react-icons/fa";
import clsx from "clsx";

import type { RtttlCategory } from "../../utils/rtttl_parser";
import { parseRtttl, getTotalDuration } from "../../utils/rtttl_parser";
import { RTTTL_CATEGORIES } from "../../constants/categories";
import { copyToClipboard } from "../../utils/clipboard";

const COLLAPSE_KEY = "rtttl-properties-collapse";

interface CollapsePrefs {
  track: boolean;
  project: boolean;
}

function loadCollapsePrefs(): CollapsePrefs {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (raw) {
      return JSON.parse(raw) as CollapsePrefs;
    }
  } catch {
    // ignore
  }
  return { track: true, project: false };
}

function saveCollapsePrefs(prefs: CollapsePrefs) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

interface PropertiesPanelProps {
  name: string;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  tracks: string[];
  focusedTrackIndex: number;
  onNameChange: (value: string) => void;
  onRenameTrack: (newName: string) => void;
  categories: RtttlCategory[];
  onCategoriesChange: (value: RtttlCategory[]) => void;
  errors: string[];
  onDiscard: () => void;
  onSubmit: () => void;
}

export function PropertiesPanel({
  name,
  nameInputRef,
  tracks,
  focusedTrackIndex,
  onNameChange,
  onRenameTrack,
  categories,
  onCategoriesChange,
  errors,
  onDiscard,
  onSubmit,
}: PropertiesPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copiedTrack, setCopiedTrack] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(() => loadCollapsePrefs().track);
  const [projectOpen, setProjectOpen] = useState(() => loadCollapsePrefs().project);
  const [catPos, setCatPos] = useState<{ bottom: number; left: number; width: number } | null>(
    null,
  );
  const catTriggerRef = useRef<HTMLButtonElement>(null);
  const catPortalRef = useRef<HTMLDivElement>(null);

  const focusedCode = tracks[focusedTrackIndex] ?? "";

  const trackStats = useMemo(() => {
    const parsed = focusedCode.trim() ? parseRtttl(focusedCode.trim()) : null;
    if (!parsed) {
      return null;
    }
    return {
      duration: getTotalDuration(parsed.notes),
      bpm: parsed.defaults.bpm,
      notes: parsed.notes.length,
      octave: parsed.defaults.octave,
      codeLength: focusedCode.length,
    };
  }, [focusedCode]);

  const focusedTrackName = useMemo(() => {
    const colonIdx = focusedCode.indexOf(":");
    return colonIdx > 0
      ? focusedCode.slice(0, colonIdx).trim() || `Track ${focusedTrackIndex + 1}`
      : `Track ${focusedTrackIndex + 1}`;
  }, [focusedCode, focusedTrackIndex]);

  useEffect(
    function closeCatOnClickOutside() {
      if (!catOpen) {
        return;
      }
      function handler(e: MouseEvent) {
        const target = e.target as Node;
        if (catTriggerRef.current?.contains(target)) {
          return;
        }
        if (catPortalRef.current?.contains(target)) {
          return;
        }
        setCatOpen(false);
      }
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    },
    [catOpen],
  );

  useEffect(
    function updateCatPosOnScrollOrResize() {
      if (!catOpen) {
        return;
      }
      function update() {
        if (catTriggerRef.current) {
          const r = catTriggerRef.current.getBoundingClientRect();
          setCatPos({ bottom: r.bottom, left: r.left, width: r.width });
        }
      }
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    },
    [catOpen],
  );

  function handleCatToggle() {
    if (!catOpen && catTriggerRef.current) {
      const r = catTriggerRef.current.getBoundingClientRect();
      setCatPos({ bottom: r.bottom, left: r.left, width: r.width });
    }
    setCatOpen((v) => !v);
  }

  function toggleTrackSection() {
    const next = !trackOpen;
    setTrackOpen(next);
    saveCollapsePrefs({ track: next, project: projectOpen });
  }

  function toggleProjectSection() {
    const next = !projectOpen;
    setProjectOpen(next);
    saveCollapsePrefs({ track: trackOpen, project: next });
  }

  async function handleCopyAll() {
    const all = tracks.filter((tk) => tk.trim()).join("\n");
    if (!all) {
      return;
    }
    const ok = await copyToClipboard(all);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopyTrack() {
    if (!focusedCode.trim()) {
      return;
    }
    const ok = await copyToClipboard(focusedCode);
    if (ok) {
      setCopiedTrack(true);
      setTimeout(() => setCopiedTrack(false), 2000);
    }
  }

  const sharedBtnClass = clsx(
    "flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors",
    "border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-200",
    "dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800",
    "disabled:cursor-not-allowed disabled:opacity-40",
  );

  return (
    <div className="flex w-48 shrink-0 flex-col border border-gray-400 bg-gray-200 sm:w-52 lg:w-64 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-400 px-3 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.properties", { defaultValue: "Properties" })}
        </h3>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Project section ── */}
        <div>
          <button
            type="button"
            onClick={toggleProjectSection}
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-300/50 dark:hover:bg-gray-800/50"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("create.project", { defaultValue: "Project" })}
            </h4>
            <FaChevronDown
              size={10}
              className={clsx(
                "shrink-0 text-gray-400 transition-transform duration-200",
                !projectOpen && "-rotate-90",
              )}
            />
          </button>

          {projectOpen && (
            <div className="space-y-3 px-3 pb-3">
              {errors.length > 0 && (
                <div className="rounded bg-red-50 px-2 py-1 dark:bg-red-900/20">
                  {errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600 dark:text-red-400">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Project Name */}
              <div>
                <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("create.name")}
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={t("create.namePlaceholder")}
                  className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              {/* Categories — portal dropdown to escape overflow/clip constraints */}
              <div>
                <button
                  ref={catTriggerRef}
                  type="button"
                  onClick={handleCatToggle}
                  className="flex w-full items-center justify-between rounded border border-gray-400 bg-white px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <span className="truncate">
                    {categories.length === 0
                      ? t("create.noneSelected", { defaultValue: "None selected" })
                      : `${categories.length} ${t("create.selected", { defaultValue: "selected" })}`}
                  </span>
                  <FaChevronDown
                    size={11}
                    className={clsx(
                      "ml-1 shrink-0 transition-transform duration-200",
                      catOpen && "rotate-180",
                    )}
                  />
                </button>
              </div>
              {catOpen &&
                catPos &&
                createPortal(
                  <div
                    ref={catPortalRef}
                    style={{
                      position: "fixed",
                      top: catPos.bottom + 4,
                      left: catPos.left,
                      width: catPos.width,
                      zIndex: 9999,
                    }}
                    className="max-h-56 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
                  >
                    {RTTTL_CATEGORIES.map((cat) => {
                      const checked = categories.includes(cat);
                      return (
                        <label
                          key={cat}
                          className={clsx(
                            "flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-1.5 text-sm last:border-b-0 dark:border-gray-700",
                            checked
                              ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              onCategoriesChange(
                                checked
                                  ? categories.filter((c) => c !== cat)
                                  : [...categories, cat],
                              )
                            }
                            className="h-3 w-3 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          {t(`categories.${cat}`)}
                        </label>
                      );
                    })}
                  </div>,
                  document.body,
                )}

              {/* Copy All Tracks */}
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={!tracks.some((tk) => tk.trim())}
                title={t("create.copyAll", { defaultValue: "Copy all track codes to clipboard" })}
                className={sharedBtnClass}
              >
                {copied ? (
                  <FaCheck size={11} className="text-green-500" />
                ) : (
                  <FaRegCopy size={11} />
                )}
                {copied
                  ? t("create.copied", { defaultValue: "Copied!" })
                  : t("create.copyAll", { defaultValue: "Copy All Tracks" })}
              </button>
            </div>
          )}
        </div>

        {/* ── Current Track section ── */}
        <div className="border-t border-gray-400 dark:border-gray-700">
          <button
            type="button"
            onClick={toggleTrackSection}
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-300/50 dark:hover:bg-gray-800/50"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("create.currentTrack", { defaultValue: "Current Track" })}
            </h4>
            <FaChevronDown
              size={10}
              className={clsx(
                "shrink-0 text-gray-400 transition-transform duration-200",
                !trackOpen && "-rotate-90",
              )}
            />
          </button>

          {trackOpen && (
            <div className="space-y-3 px-3 pb-3">
              {/* Track Name */}
              <div>
                <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("create.trackName", { defaultValue: "Track Name" })}
                </label>
                <input
                  type="text"
                  value={focusedTrackName}
                  onChange={(e) => onRenameTrack(e.target.value)}
                  className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>

              {/* Track stats */}
              {trackStats ? (
                <dl className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <dt>{t("create.trackDuration", { defaultValue: "Duration" })}</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">
                      {(trackStats.duration / 1000).toFixed(3)}s
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("create.trackBpm", { defaultValue: "BPM" })}</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">{trackStats.bpm}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("create.trackNotes", { defaultValue: "Notes" })}</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">
                      {trackStats.notes}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("create.trackOctave", { defaultValue: "Octave" })}</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">
                      {trackStats.octave}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("create.trackCodeLength", { defaultValue: "Code length" })}</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">
                      {trackStats.codeLength}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}

              {/* Copy current track */}
              <button
                type="button"
                onClick={handleCopyTrack}
                disabled={!focusedCode.trim()}
                className={sharedBtnClass}
              >
                {copiedTrack ? (
                  <FaCheck size={11} className="text-green-500" />
                ) : (
                  <FaRegCopy size={11} />
                )}
                {copiedTrack
                  ? t("create.copied", { defaultValue: "Copied!" })
                  : t("create.copyCurrentTrack", { defaultValue: "Copy Track" })}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t border-gray-400 px-3 py-3 dark:border-gray-700">
        <button
          onClick={onSubmit}
          disabled={!tracks.some((tk) => tk.trim().length > 0)}
          className="w-full rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("create.create")}
        </button>
        <button
          onClick={onDiscard}
          className="w-full rounded border border-gray-400 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t("create.cancel")}
        </button>
      </div>
    </div>
  );
}
