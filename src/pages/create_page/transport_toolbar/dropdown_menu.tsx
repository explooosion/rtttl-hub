import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import clsx from "clsx";

export type MenuItemDef =
  | {
      type: "action";
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
      /** Shows a coloured dot/check on the right to indicate an active/toggled state. */
      active?: boolean;
      onClick: () => void;
    }
  | { type: "separator" };

export function DropdownMenu({ label, items }: { label: string; items: MenuItemDef[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex h-8 items-center gap-0.5 rounded px-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700",
          open && "bg-gray-200 dark:bg-gray-700",
        )}
      >
        {label}
        <FaChevronDown size={8} className="mt-px opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-60 mt-0.5 min-w-47 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {items.map((item, i) => {
            if (item.type === "separator") {
              return <div key={i} className="my-1 h-px bg-gray-100 dark:bg-gray-800" />;
            }
            return (
              <button
                key={i}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  item.disabled
                    ? "cursor-default text-gray-300 dark:text-gray-600"
                    : item.active
                      ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300",
                )}
              >
                {item.icon && (
                  <span className={clsx("w-5 shrink-0 text-center", !item.active && "opacity-60")}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.active && (
                  <span className="ml-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Separator() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-gray-300 dark:bg-gray-700" />;
}
