import { createPortal } from "react-dom";
import { FaRegCopy, FaCheck, FaChevronDown } from "react-icons/fa";
import clsx from "clsx";
import type { TFunction } from "i18next";

import type { RtttlCategory } from "../../../utils/rtttl_parser";
import { RTTTL_CATEGORIES } from "../../../constants/categories";

interface ProjectSectionProps {
  t: TFunction;
  projectOpen: boolean;
  onToggleProjectSection: () => void;
  errors: string[];
  name: string;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  onProjectNameInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: RtttlCategory[];
  catTriggerRef: React.RefObject<HTMLButtonElement | null>;
  catPortalRef: React.RefObject<HTMLDivElement | null>;
  catOpen: boolean;
  catPos: { bottom: number; left: number; width: number } | null;
  onToggleCategories: () => void;
  categoryCheckboxHandlers: Record<RtttlCategory, () => void>;
  copied: boolean;
  tracks: string[];
  onCopyAll: () => void;
  sharedBtnClass: string;
}

export function ProjectSection({
  t,
  projectOpen,
  onToggleProjectSection,
  errors,
  name,
  nameInputRef,
  onProjectNameInputChange,
  categories,
  catTriggerRef,
  catPortalRef,
  catOpen,
  catPos,
  onToggleCategories,
  categoryCheckboxHandlers,
  copied,
  tracks,
  onCopyAll,
  sharedBtnClass,
}: ProjectSectionProps) {
  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={onToggleProjectSection}
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

          <div>
            <label className="mb-0.5 block text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("create.name")}
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={onProjectNameInputChange}
              placeholder={t("create.namePlaceholder")}
              className="w-full rounded border border-gray-400 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          <div>
            <button
              ref={catTriggerRef}
              type="button"
              onClick={onToggleCategories}
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
                        onChange={categoryCheckboxHandlers[cat]}
                        className="h-3 w-3 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      {t(`categories.${cat}`)}
                    </label>
                  );
                })}
              </div>,
              document.body,
            )}

          <button
            type="button"
            onClick={onCopyAll}
            disabled={!tracks.some((track) => track.trim())}
            title={t("create.copyAll", { defaultValue: "Copy all track codes to clipboard" })}
            className={sharedBtnClass}
          >
            {copied ? <FaCheck size={11} className="text-green-500" /> : <FaRegCopy size={11} />}
            {copied
              ? t("create.copied", { defaultValue: "Copied!" })
              : t("create.copyAll", { defaultValue: "Copy All Tracks" })}
          </button>
        </div>
      )}
    </div>
  );
}
