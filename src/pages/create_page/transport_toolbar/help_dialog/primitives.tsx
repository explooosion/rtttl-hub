import { formatShortcut } from "../../utils/keyboard_utils";

import type { ReactNode } from "react";

interface GuideItemProps {
  icon: ReactNode;
  label: string;
  desc: string;
}

export function GuideItem({ icon, label, desc }: GuideItemProps) {
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

interface ShortcutItemProps {
  keys: string;
  label: string;
}

export function ShortcutItem({ keys, label }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <kbd className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {formatShortcut(keys)}
      </kbd>
    </div>
  );
}

interface RtttlItemProps {
  token: string;
  desc: string;
}

export function RtttlItem({ token, desc }: RtttlItemProps) {
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
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}
