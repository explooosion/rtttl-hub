import { useTranslation } from "react-i18next";

import { LetterHeader, TrackRow } from "../../components/track_row";
import type { TrackRowAction } from "../../components/track_row";
import { PaginationControls } from "./pagination_controls";
import type { RtttlEntry } from "../../utils/rtttl_parser";
import type { RowData } from "./shared";

interface TrackListContentProps {
  items: RtttlEntry[];
  filteredItemCount: number;
  rowData: RowData[];
  extraRowActions?: TrackRowAction[];
  showActionsAsMenu: boolean;
  pinnedRowAction?: TrackRowAction;
  emptyNode?: React.ReactNode;
  totalPages: number;
  safePage: number;
  startPage: number;
  endPage: number;
  pageNumbers: number[];
  pageNumberClickHandlers: Record<number, () => void>;
  onPrevPageClick: VoidFunction;
  onFirstPageClick: VoidFunction;
  onLastPageClick: VoidFunction;
  onNextPageClick: VoidFunction;
}

export function TrackListContent({
  items,
  filteredItemCount,
  rowData,
  extraRowActions,
  showActionsAsMenu,
  pinnedRowAction,
  emptyNode,
  totalPages,
  safePage,
  startPage,
  endPage,
  pageNumbers,
  pageNumberClickHandlers,
  onPrevPageClick,
  onFirstPageClick,
  onLastPageClick,
  onNextPageClick,
}: TrackListContentProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      emptyNode ?? (
        <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
          {t("search.noResults")}
        </div>
      )
    );
  }

  if (filteredItemCount === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 dark:text-gray-500">
        {t("search.noResults")}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {rowData.map((row, index) => {
          if (row.type === "header") {
            return <LetterHeader key={`header-${row.letter}-${index}`} letter={row.letter} />;
          }
          return (
            <TrackRow
              key={`item-${row.item.id}`}
              item={row.item}
              extraActions={extraRowActions}
              showActionsAsMenu={showActionsAsMenu}
              pinnedAction={pinnedRowAction}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <PaginationControls
          safePage={safePage}
          totalPages={totalPages}
          startPage={startPage}
          endPage={endPage}
          pageNumbers={pageNumbers}
          pageNumberClickHandlers={pageNumberClickHandlers}
          onPrevPageClick={onPrevPageClick}
          onFirstPageClick={onFirstPageClick}
          onLastPageClick={onLastPageClick}
          onNextPageClick={onNextPageClick}
        />
      )}
    </>
  );
}
