import { useRef, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { RTTTL_CATEGORIES } from "../../../constants/categories";
import type { RtttlCategory } from "../../../utils/rtttl_parser";
import { parseRtttl, getTotalDuration } from "../../../utils/rtttl_parser";
import { copyToClipboard } from "../../../utils/clipboard";
import { ProjectSection } from "./project_section";
import {
  loadCollapsePrefs,
  parseTrackDefaults,
  saveCollapsePrefs,
  splitTrackParts,
  type PropertiesPanelProps,
} from "./shared";
import { TrackSection } from "./track_section";

export function PropertiesPanel({
  name,
  nameInputRef,
  tracks,
  focusedTrackIndex,
  onNameChange,
  onRenameTrack,
  onTrackCodeChange,
  categories,
  onCategoriesChange,
  errors,
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

  const trackStats = useMemo(
    function buildTrackStats() {
      const parsed = focusedCode.trim() ? parseRtttl(focusedCode.trim()) : null;
      if (!parsed) {
        return null;
      }
      return {
        duration: getTotalDuration(parsed.notes),
        notes: parsed.notes.length,
        codeLength: focusedCode.length,
      };
    },
    [focusedCode],
  );

  const editableDefaults = useMemo(
    function buildEditableDefaults() {
      if (!focusedCode.trim()) {
        return null;
      }
      const parts = splitTrackParts(focusedCode);
      if (!parts) {
        return null;
      }
      return parseTrackDefaults(parts.defaultsPart);
    },
    [focusedCode],
  );

  const focusedTrackName = useMemo(
    function buildFocusedTrackName() {
      const colonIdx = focusedCode.indexOf(":");
      return colonIdx > 0
        ? focusedCode.slice(0, colonIdx).trim() || `Track ${focusedTrackIndex + 1}`
        : `Track ${focusedTrackIndex + 1}`;
    },
    [focusedCode, focusedTrackIndex],
  );

  useEffect(
    function closeCategoryDropdownOnClickOutside() {
      if (!catOpen) {
        return;
      }
      function handleMousedown(e: MouseEvent) {
        const target = e.target as Node;
        if (catTriggerRef.current?.contains(target)) {
          return;
        }
        if (catPortalRef.current?.contains(target)) {
          return;
        }
        setCatOpen(false);
      }
      document.addEventListener("mousedown", handleMousedown);
      return () => document.removeEventListener("mousedown", handleMousedown);
    },
    [catOpen],
  );

  useEffect(
    function updateCategoryDropdownPositionWhenOpen() {
      if (!catOpen) {
        return;
      }
      function updatePosition() {
        if (catTriggerRef.current) {
          const rect = catTriggerRef.current.getBoundingClientRect();
          setCatPos({ bottom: rect.bottom, left: rect.left, width: rect.width });
        }
      }
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    },
    [catOpen],
  );

  function handleProjectNameInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onNameChange(e.target.value);
  }

  function handleCategoryToggle() {
    if (!catOpen && catTriggerRef.current) {
      const rect = catTriggerRef.current.getBoundingClientRect();
      setCatPos({ bottom: rect.bottom, left: rect.left, width: rect.width });
    }
    setCatOpen((isOpen) => !isOpen);
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
    const allTracks = tracks.filter((track) => track.trim()).join("\n");
    if (!allTracks) {
      return;
    }
    const ok = await copyToClipboard(allTracks);
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

  function commitTrackDefault(key: "d" | "o" | "b", rawValue: string, min: number, max: number) {
    const parts = splitTrackParts(focusedCode);
    if (!parts) {
      return;
    }
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    const clampedValue = Math.max(min, Math.min(max, parsed));
    const defaults = parseTrackDefaults(parts.defaultsPart);
    if (key === "d") {
      defaults.duration = clampedValue;
    } else if (key === "o") {
      defaults.octave = clampedValue;
    } else {
      defaults.bpm = clampedValue;
    }

    const nextDefaults = `d=${defaults.duration},o=${defaults.octave},b=${defaults.bpm}`;
    const nextCode = `${parts.namePart}:${nextDefaults}:${parts.notesPart}`;
    if (nextCode !== focusedCode) {
      onTrackCodeChange(nextCode);
    }
  }

  const categoryCheckboxHandlers = useMemo(
    function buildCategoryCheckboxHandlers() {
      const handlers: Record<RtttlCategory, () => void> = {} as Record<RtttlCategory, () => void>;
      for (const category of RTTTL_CATEGORIES) {
        handlers[category] = function handleCategoryCheckboxChange() {
          const checked = categories.includes(category);
          onCategoriesChange(
            checked
              ? categories.filter((currentCategory) => currentCategory !== category)
              : [...categories, category],
          );
        };
      }
      return handlers;
    },
    [categories, onCategoriesChange],
  );

  function handleTrackNameInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onRenameTrack(e.target.value);
  }

  function handleDurationDefaultInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    commitTrackDefault("d", e.currentTarget.value, 1, 64);
  }

  function handleOctaveDefaultInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    commitTrackDefault("o", e.currentTarget.value, 1, 8);
  }

  function handleBpmDefaultInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    commitTrackDefault("b", e.currentTarget.value, 20, 900);
  }

  const sharedBtnClass = clsx(
    "flex w-full items-center justify-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors",
    "border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-200",
    "dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800",
    "disabled:cursor-not-allowed disabled:opacity-40",
  );

  return (
    <div className="flex w-48 shrink-0 flex-col border border-gray-400 bg-gray-200 sm:w-52 lg:w-64 dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-400 px-3 py-2 dark:border-gray-700">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("create.properties", { defaultValue: "Properties" })}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ProjectSection
          t={t}
          projectOpen={projectOpen}
          onToggleProjectSection={toggleProjectSection}
          errors={errors}
          name={name}
          nameInputRef={nameInputRef}
          onProjectNameInputChange={handleProjectNameInputChange}
          categories={categories}
          catTriggerRef={catTriggerRef}
          catPortalRef={catPortalRef}
          catOpen={catOpen}
          catPos={catPos}
          onToggleCategories={handleCategoryToggle}
          categoryCheckboxHandlers={categoryCheckboxHandlers}
          copied={copied}
          tracks={tracks}
          onCopyAll={handleCopyAll}
          sharedBtnClass={sharedBtnClass}
        />

        <TrackSection
          t={t}
          trackOpen={trackOpen}
          onToggleTrackSection={toggleTrackSection}
          focusedTrackName={focusedTrackName}
          onTrackNameInputChange={handleTrackNameInputChange}
          editableDefaults={editableDefaults}
          focusedTrackIndex={focusedTrackIndex}
          focusedCode={focusedCode}
          onDurationDefaultInputChange={handleDurationDefaultInputChange}
          onOctaveDefaultInputChange={handleOctaveDefaultInputChange}
          onBpmDefaultInputChange={handleBpmDefaultInputChange}
          trackStats={trackStats}
          copiedTrack={copiedTrack}
          onCopyTrack={handleCopyTrack}
          sharedBtnClass={sharedBtnClass}
        />
      </div>
    </div>
  );
}
