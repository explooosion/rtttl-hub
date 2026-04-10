import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRegCopy, FaCheck, FaChevronDown } from "react-icons/fa";
import { useState, useMemo } from "react";
import clsx from "clsx";

import type { RtttlCategory } from "../../utils/rtttl_parser";
import { parseRtttl, getTotalDuration } from "../../utils/rtttl_parser";
import { RTTTL_CATEGORIES } from "../../constants/categories";
import { copyToClipboard } from "../../utils/clipboard";

interface PropertiesPanelProps {
  name: string;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  tracks: string[];
  focusedTrackIndex: number;
  onNameChange: (value: string) => void;
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
  const catDropdownRef = useRef<HTMLDivElement>(null);

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
      defaultDuration: parsed.defaults.duration,
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
    function closeCatDropdownOnClickOutside() {
      if (!catOpen) {
        return;
      }
      function handleMouseDown(e: MouseEvent) {
        if (catDropdownRef.current?.contains(e.target as Node)) {
          return;
        }
        setCatOpen(false);
      }
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    },
    [catOpen],
  );

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

  return (
    <div className="flex w-48 shrink-0 flex-col border-l border-gray-400 bg-gray-200 sm:w-52 lg:w-64 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-400 px-3 py-2 dark:border-gray-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.properties", { defaultValue: "Properties" })}
        </h3>
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {errors.length > 0 && (
          <div className="rounded bg-red-50 px-2 py-1 dark:bg-red-900/20">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-600 dark:text-red-400">
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Name */}
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

        {/* Categories */}
        <div>
          <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("create.category")}
          </label>
          <div className="relative" ref={catDropdownRef}>
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded border border-gray-400 bg-white px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <span className="truncate">
                {categories.length === 0
                  ? t("create.noneSelected", { defaultValue: "None selected" })
                  : categories.map((c) => t(`categories.${c}`)).join(", ")}
              </span>
              <FaChevronDown
                size={11}
                className={clsx("ml-1 shrink-0 transition-transform", catOpen && "rotate-180")}
              />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 p-2">
                  {RTTTL_CATEGORIES.map((cat) => {
                    const checked = categories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={clsx(
                          "flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-sm transition-colors",
                          checked
                            ? "font-medium text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/40",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            onCategoriesChange(
                              checked ? categories.filter((c) => c !== cat) : [...categories, cat],
                            )
                          }
                          className="h-3 w-3 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                        {t(`categories.${cat}`)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Copy All Tracks */}
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={!tracks.some((tk) => tk.trim())}
          title={t("create.copyAll", { defaultValue: "Copy all track codes to clipboard" })}
          className={clsx(
            "flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors",
            "border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-200",
            "dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {copied ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
          {copied
            ? t("create.copied", { defaultValue: "Copied!" })
            : t("create.copyAll", { defaultValue: "Copy All Tracks" })}
        </button>
      </div>

      {/* Current Track Section */}
      <div className="border-t border-gray-400 px-3 py-3 dark:border-gray-800">
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.currentTrack", { defaultValue: "Current Track" })}
        </h4>
        <p className="mb-2 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
          {focusedTrackName}
        </p>

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
              <dd className="font-mono text-gray-800 dark:text-gray-200">{trackStats.notes}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("create.trackOctave", { defaultValue: "Octave" })}</dt>
              <dd className="font-mono text-gray-800 dark:text-gray-200">{trackStats.octave}</dd>
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
          className={clsx(
            "mt-2 flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors",
            "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100",
            "dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {copiedTrack ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
          {copiedTrack
            ? t("create.copied", { defaultValue: "Copied!" })
            : t("create.copyCurrentTrack", { defaultValue: "Copy Track" })}
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-2 border-t border-gray-400 px-3 py-3 dark:border-gray-800">
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
