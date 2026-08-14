import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaHeart } from "react-icons/fa";

import { useCollectionStore } from "../stores/collection_store";
import { useFavoritesStore } from "../stores/favorites_store";
import { useTrackStatsStore } from "../stores/track_stats_store";
import { ListPageLayout } from "../layouts/list_page_layout";

export function FavoritesPage() {
  const { t } = useTranslation();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const loadStats = useTrackStatsStore((s) => s.loadStats);
  const getStatsForTrack = useTrackStatsStore((s) => s.getStatsForTrack);

  const filteredItems = useMemo(() => {
    const allItems = [...items, ...userItems];
    const idSet = new Set(favoriteIds);
    return allItems.filter((item) => idSet.has(item.id));
  }, [items, userItems, favoriteIds]);

  // Load statistics when filtered items change
  useEffect(() => {
    const trackIds = filteredItems.map((item) => item.id);
    if (trackIds.length > 0) {
      loadStats(trackIds);
    }
  }, [filteredItems, loadStats]);

  // Inject real statistics from Firestore
  const favoriteItems = useMemo(() => {
    return filteredItems.map((item) => {
      const stats = getStatsForTrack(item.id);
      return {
        ...item,
        playCount: stats?.playCount ?? 0,
      };
    });
  }, [filteredItems, getStatsForTrack]);

  const emptyNode = (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
      <FaHeart size={48} className="opacity-50" />
      <p className="text-center">{t("favorites.empty")}</p>
    </div>
  );

  return (
    <ListPageLayout
      items={favoriteItems}
      breadcrumbs={[{ label: t("breadcrumb.home"), to: "/" }, { label: t("nav.favorites") }]}
      title={t("nav.favorites")}
      emptyNode={emptyNode}
    />
  );
}
