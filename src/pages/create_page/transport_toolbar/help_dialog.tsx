import { useTranslation } from "react-i18next";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  FaPlay,
  FaStop,
  FaUndo,
  FaRedo,
  FaPlus,
  FaTrash,
  FaVolumeMute,
  FaFileImport,
  FaCode,
  FaCrosshairs,
  FaEyeSlash,
  FaPalette,
  FaGripVertical,
  FaChevronDown,
  FaClone,
  FaEraser,
  FaRegCopy,
} from "react-icons/fa";

interface GuideItemProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
}

function GuideItem({ icon, label, desc }: GuideItemProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
        {icon}
      </span>
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="block text-sm text-gray-500 dark:text-gray-400">{desc}</span>
      </div>
    </div>
  );
}

interface RtttlItemProps {
  token: string;
  desc: string;
}

function RtttlItem({ token, desc }: RtttlItemProps) {
  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
        {token}
      </code>
      <span className="text-sm text-gray-700 dark:text-gray-200">{desc}</span>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <DialogTitle className="text-base font-semibold text-gray-800 dark:text-white">
            {t("editor.toolbar.helpTitle", { defaultValue: "Studio Guide" })}
          </DialogTitle>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Column 1 — Toolbar */}
            <Section title={t("editor.guide.toolbar", { defaultValue: "Toolbar" })}>
              <GuideItem
                icon={<FaPlay size={11} />}
                label={t("editor.guide.playPause", { defaultValue: "Play / Pause" })}
                desc={t("editor.guide.playPauseDesc", {
                  defaultValue: "Toggle playback preview",
                })}
              />
              <GuideItem
                icon={<FaStop size={11} />}
                label={t("editor.guide.stop", { defaultValue: "Stop" })}
                desc={t("editor.guide.stopDesc", {
                  defaultValue: "Halt playback, return to start",
                })}
              />
              <GuideItem
                icon={<FaUndo size={11} />}
                label={t("editor.guide.undo", { defaultValue: "Undo / Redo" })}
                desc={t("editor.guide.undoDesc", { defaultValue: "Step through edit history" })}
              />
              <GuideItem
                icon={<FaRedo size={11} />}
                label={t("editor.guide.redo", { defaultValue: "Redo" })}
                desc={t("editor.guide.redoDesc", { defaultValue: "Restore reverted edit" })}
              />
              <GuideItem
                icon={<FaPlus size={11} />}
                label={t("editor.guide.addTrack", { defaultValue: "Add Track" })}
                desc={t("editor.guide.addTrackDesc", {
                  defaultValue: "Insert a new RTTTL track",
                })}
              />
              <GuideItem
                icon={<FaTrash size={11} />}
                label={t("editor.guide.removeTrack", { defaultValue: "Remove Track" })}
                desc={t("editor.guide.removeTrackDesc", {
                  defaultValue: "Delete the focused track",
                })}
              />
              <GuideItem
                icon={<FaVolumeMute size={11} />}
                label={t("editor.guide.muteTrack", { defaultValue: "Mute Track" })}
                desc={t("editor.guide.muteTrackDesc", {
                  defaultValue: "Toggle mute on the focused track",
                })}
              />
              <GuideItem
                icon={<FaFileImport size={11} />}
                label={t("editor.guide.import", { defaultValue: "Import" })}
                desc={t("editor.guide.importDesc", {
                  defaultValue: "Paste one or more RTTTL lines",
                })}
              />
              <GuideItem
                icon={<FaCode size={11} />}
                label={t("editor.guide.syntax", { defaultValue: "Syntax Highlight" })}
                desc={t("editor.guide.syntaxDesc", { defaultValue: "Toggle code coloring" })}
              />
              <GuideItem
                icon={<FaCrosshairs size={11} />}
                label={t("editor.guide.follow", { defaultValue: "Follow Playback" })}
                desc={t("editor.guide.followDesc", {
                  defaultValue: "Auto-scroll editor to current note",
                })}
              />
              <GuideItem
                icon={<FaPalette size={11} />}
                label={t("editor.guide.colors", { defaultValue: "Syntax Colors" })}
                desc={t("editor.guide.colorsDesc", {
                  defaultValue: "Customize syntax token colors",
                })}
              />
            </Section>

            {/* Column 2 — Track Lane */}
            <Section title={t("editor.guide.trackLane", { defaultValue: "Track Lane" })}>
              <GuideItem
                icon={<FaGripVertical size={11} />}
                label={t("editor.guide.dragHandle", { defaultValue: "Drag Handle" })}
                desc={t("editor.guide.dragHandleDesc", {
                  defaultValue: "Drag up or down to reorder tracks",
                })}
              />
              <GuideItem
                icon={
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-1 ring-white/60" />
                }
                label={t("editor.guide.colorDot", { defaultValue: "Color Dot" })}
                desc={t("editor.guide.colorDotDesc", {
                  defaultValue: "Click to change the track color",
                })}
              />
              <GuideItem
                icon={<FaChevronDown size={11} />}
                label={t("editor.guide.expand", { defaultValue: "Expand / Collapse" })}
                desc={t("editor.guide.expandDesc", {
                  defaultValue: "Show or hide the inline RTTTL editor",
                })}
              />
              <GuideItem
                icon={<FaVolumeMute size={11} />}
                label={t("editor.guide.trackMute", { defaultValue: "Mute" })}
                desc={t("editor.guide.trackMuteDesc", {
                  defaultValue: "Silence this track only",
                })}
              />
              <GuideItem
                icon={<FaClone size={11} />}
                label={t("editor.guide.duplicate", { defaultValue: "Duplicate" })}
                desc={t("editor.guide.duplicateDesc", {
                  defaultValue: "Copy this track to a new slot",
                })}
              />
              <GuideItem
                icon={<FaEyeSlash size={11} />}
                label={t("editor.guide.deactivate", { defaultValue: "Deactivate" })}
                desc={t("editor.guide.deactivateDesc", {
                  defaultValue: "Grey out and exclude from playback",
                })}
              />
              <GuideItem
                icon={<FaTrash size={11} />}
                label={t("editor.guide.trackRemove", { defaultValue: "Remove" })}
                desc={t("editor.guide.trackRemoveDesc", {
                  defaultValue: "Delete this track permanently",
                })}
              />
              <GuideItem
                icon={<FaEraser size={11} />}
                label={t("editor.guide.clear", { defaultValue: "Clear" })}
                desc={t("editor.guide.clearDesc", { defaultValue: "Reset RTTTL code to empty" })}
              />
              <GuideItem
                icon={<FaRegCopy size={11} />}
                label={t("editor.guide.copy", { defaultValue: "Copy" })}
                desc={t("editor.guide.copyDesc", {
                  defaultValue: "Copy RTTTL code to clipboard",
                })}
              />
            </Section>

            {/* Column 3 — RTTTL Format */}
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
                  <RtttlItem
                    token="b="
                    desc={t("editor.guide.fieldB", { defaultValue: "Tempo in BPM" })}
                  />
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
                    <span className="text-indigo-500">8</span>c
                    <span className="text-indigo-500">5</span> — 8th note C5
                  </span>
                  <span>
                    <span className="text-indigo-500">4</span>g
                    <span className="text-amber-500">#</span>
                    <span className="text-indigo-500">4</span> — quarter G♯4
                  </span>
                  <span>
                    <span className="text-indigo-500">2</span>a
                    <span className="text-amber-500">.</span> — dotted half A
                  </span>
                  <span>
                    <span className="text-green-600 dark:text-green-400">p</span> — rest
                  </span>
                </div>
              </div>
            </Section>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {t("confirm.ok", { defaultValue: "Got it" })}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
