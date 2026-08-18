import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import clsx from "clsx";

interface PaginationControlsProps {
  safePage: number;
  totalPages: number;
  startPage: number;
  endPage: number;
  pageNumbers: number[];
  pageNumberClickHandlers: Record<number, () => void>;
  onPrevPageClick: VoidFunction;
  onFirstPageClick: VoidFunction;
  onLastPageClick: VoidFunction;
  onNextPageClick: VoidFunction;
}

export function PaginationControls({
  safePage,
  totalPages,
  startPage,
  endPage,
  pageNumbers,
  pageNumberClickHandlers,
  onPrevPageClick,
  onFirstPageClick,
  onLastPageClick,
  onNextPageClick,
}: PaginationControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onPrevPageClick}
        disabled={safePage <= 1}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <FaChevronLeft size={14} />
      </button>

      {startPage > 1 && (
        <>
          <button
            type="button"
            onClick={onFirstPageClick}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            1
          </button>
          {startPage > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={pageNumberClickHandlers[page]}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            page === safePage
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
          )}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <button
            type="button"
            onClick={onLastPageClick}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onNextPageClick}
        disabled={safePage >= totalPages}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <FaChevronRight size={14} />
      </button>
    </div>
  );
}
