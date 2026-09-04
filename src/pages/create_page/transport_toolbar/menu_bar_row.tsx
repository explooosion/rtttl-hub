import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaUser, FaMusic, FaFileAudio, FaFileImport } from "react-icons/fa";

import { useAuthStore } from "../../../stores/auth_store";
import { buildLoginPath } from "../../../utils/auth_redirect";
import { DropdownMenu, MenuBar } from "./dropdown_menu";
import type { MenuItemDef } from "./dropdown_menu";
import { formatTooltipWithShortcut, platformShortcut } from "../utils/keyboard_utils";

interface MenuBarRowProps {
  fileItems: MenuItemDef[];
  editItems: MenuItemDef[];
  viewItems: MenuItemDef[];
  transportItems: MenuItemDef[];
  importItems: MenuItemDef[];
  helpItems: MenuItemDef[];
  canCreate: boolean;
  isEditMode: boolean;
  onCreate: VoidFunction;
  onDiscard: VoidFunction;
  onImport: VoidFunction;
  onAudioExtract: VoidFunction;
  onOpenMidiImport: VoidFunction;
}

export function MenuBarRow({
  fileItems,
  editItems,
  viewItems,
  transportItems,
  importItems,
  helpItems,
  canCreate,
  isEditMode,
  onCreate,
  onDiscard,
  onImport,
  onAudioExtract,
  onOpenMidiImport,
}: MenuBarRowProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="shrink-0 overflow-x-auto border-b border-gray-300 bg-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center gap-1 px-3 py-1">
        <MenuBar>
          <DropdownMenu label={t("create.menuFile", { defaultValue: "File" })} items={fileItems} />
          <DropdownMenu label={t("create.menuEdit", { defaultValue: "Edit" })} items={editItems} />
          <DropdownMenu label={t("create.menuView", { defaultValue: "View" })} items={viewItems} />
          <DropdownMenu
            label={t("create.menuTransport", { defaultValue: "Transport" })}
            items={transportItems}
          />
          <DropdownMenu
            label={t("create.menuImport", { defaultValue: "Import" })}
            items={importItems}
          />
          <DropdownMenu label={t("create.menuHelp", { defaultValue: "Help" })} items={helpItems} />
        </MenuBar>

        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          <button
            type="button"
            onClick={onImport}
            className="flex h-9 items-center gap-1.5 rounded-md bg-emerald-500 px-3 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <FaFileImport size={11} />
            {t("create.import", { defaultValue: "Import RTTTL" })}
          </button>
          <button
            type="button"
            onClick={onOpenMidiImport}
            className="flex h-9 items-center gap-1.5 rounded-md bg-sky-500 px-3 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            <FaFileAudio size={11} />
            {t("create.menuImportMidi", { defaultValue: "Import MIDI" })}
          </button>
          <button
            type="button"
            onClick={onAudioExtract}
            className="flex h-9 items-center gap-1.5 rounded-md bg-amber-500 px-3 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            <FaMusic size={11} />
            {t("audioExtract.quickButton", { defaultValue: "AI Recognition" })}
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={!canCreate}
            title={formatTooltipWithShortcut(
              isEditMode
                ? t("create.update", { defaultValue: "Update" })
                : t("create.create", { defaultValue: "Create" }),
              platformShortcut("s"),
            )}
            className="flex h-9 min-w-[104px] items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEditMode ? t("create.update") : t("create.create")}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex h-9 min-w-[92px] items-center justify-center rounded-md border border-gray-400 px-4 text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("create.cancel")}
          </button>

          <span className="mx-1 h-5 w-px bg-gray-400 dark:bg-gray-600" />

          {user ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              <FaUser size={11} className="shrink-0" />
              <span className="max-w-[120px] truncate">{user.displayName}</span>
            </span>
          ) : (
            <Link
              to={buildLoginPath(location.pathname + location.search)}
              className="flex h-9 items-center justify-center rounded-md border border-indigo-400 px-3 text-sm font-medium whitespace-nowrap text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              {t("auth.signIn", { defaultValue: "Sign In" })}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
