import { FaKeyboard } from "react-icons/fa";

import { buildShortcutRows, buildToolbarRows, buildTrackLaneRows } from "./guide_data";
import { GuideItem, RtttlItem, Section, ShortcutItem } from "./primitives";

import type { TFunction } from "i18next";

interface SectionProps {
  t: TFunction;
}

export function ToolbarGuideSection({ t }: SectionProps) {
  const rows = buildToolbarRows(t);

  return (
    <Section title={t("editor.guide.toolbar", { defaultValue: "Toolbar" })}>
      {rows.map((row) => (
        <GuideItem key={row.label} icon={row.icon} label={row.label} desc={row.desc} />
      ))}
    </Section>
  );
}

export function TrackLaneGuideSection({ t }: SectionProps) {
  const rows = buildTrackLaneRows(t);

  return (
    <Section title={t("editor.guide.trackLane", { defaultValue: "Track Lane" })}>
      {rows.map((row) => (
        <GuideItem key={row.label} icon={row.icon} label={row.label} desc={row.desc} />
      ))}
    </Section>
  );
}

export function RtttlFormatGuideSection({ t }: SectionProps) {
  return (
    <Section title={t("editor.guide.rtttlFormat", { defaultValue: "RTTTL Format" })}>
      <div className="rounded-lg bg-gray-100 px-2.5 py-1.5 font-mono text-xs text-indigo-600 dark:bg-gray-700/60 dark:text-indigo-300">
        name : d=4, o=5, b=120 : notes
      </div>

      <div className="mt-0.5">
        <p className="mb-1.5 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400">
          {t("editor.guide.headerFields", { defaultValue: "Header fields" })}
        </p>
        <div className="flex flex-col gap-1.5">
          <RtttlItem
            token="d="
            desc={t("editor.guide.fieldD", {
              defaultValue: "Default duration (1 2 4 8 16 32)",
            })}
          />
          <RtttlItem
            token="o="
            desc={t("editor.guide.fieldO", { defaultValue: "Default octave (4–7)" })}
          />
          <RtttlItem token="b=" desc={t("editor.guide.fieldB", { defaultValue: "Tempo in BPM" })} />
        </div>
      </div>

      <div className="mt-0.5">
        <p className="mb-1.5 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400">
          {t("editor.guide.noteModifiers", { defaultValue: "Note modifiers" })}
        </p>
        <div className="flex flex-col gap-1.5">
          <RtttlItem
            token="#"
            desc={t("editor.guide.modSharp", { defaultValue: "Sharp  (e.g. c#5)" })}
          />
          <RtttlItem
            token="."
            desc={t("editor.guide.modDot", { defaultValue: "Dotted — 1.5× duration" })}
          />
          <RtttlItem
            token="p"
            desc={t("editor.guide.modPause", { defaultValue: "Rest / silence" })}
          />
        </div>
      </div>

      <div className="mt-0.5">
        <p className="mb-1.5 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400">
          {t("editor.guide.notes", { defaultValue: "Notes" })}
        </p>
        <p className="font-mono text-sm text-gray-700 dark:text-gray-200">
          c &nbsp;d &nbsp;e &nbsp;f &nbsp;g &nbsp;a &nbsp;b
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("editor.guide.notesHint", {
            defaultValue: "Prefix duration, suffix octave freely",
          })}
        </p>
      </div>

      <div className="mt-0.5">
        <p className="mb-1.5 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-400">
          {t("editor.guide.example", { defaultValue: "Examples" })}
        </p>
        <div className="flex flex-col gap-1 font-mono text-sm text-gray-700 dark:text-gray-200">
          <span>
            <span className="text-indigo-500">8</span>c<span className="text-indigo-500">5</span> —
            8th note C5
          </span>
          <span>
            <span className="text-indigo-500">4</span>g<span className="text-amber-500">#</span>
            <span className="text-indigo-500">4</span> — quarter G♯4
          </span>
          <span>
            <span className="text-indigo-500">2</span>a<span className="text-amber-500">.</span> —
            dotted half A
          </span>
          <span>
            <span className="text-green-600 dark:text-green-400">p</span> — rest
          </span>
        </div>
      </div>
    </Section>
  );
}

export function ShortcutsGuideSection({ t }: SectionProps) {
  const rows = buildShortcutRows(t);

  return (
    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800/50 dark:bg-indigo-950/30">
      <div className="mb-3 flex items-center gap-2">
        <FaKeyboard className="text-indigo-600 dark:text-indigo-400" size={16} />
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {t("editor.guide.shortcuts", { defaultValue: "Keyboard Shortcuts" })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3">
        {rows.map((row) => (
          <ShortcutItem key={`${row.label}-${row.keys}`} keys={row.keys} label={row.label} />
        ))}
      </div>
    </div>
  );
}
