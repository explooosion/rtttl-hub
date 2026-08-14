import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCollectionStore } from "../stores/collection_store";
import { useTrackStatsStore } from "../stores/track_stats_store";
import { ListPageLayout } from "../layouts/list_page_layout";

export function CreatorPage() {
  const { t } = useTranslation();
  const { creatorId } = useParams<{ creatorId: string }>();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const loadStats = useTrackStatsStore((s) => s.loadStats);
  const getStatsForTrack = useTrackStatsStore((s) => s.getStatsForTrack);

  const creatorName = creatorId ? decodeURIComponent(creatorId) : "";

  const filteredItems = useMemo(() => {
    return [...items, ...userItems].filter((item) => item.artist === creatorName);
  }, [items, userItems, creatorName]);

  // Load statistics when filtered items change
  useEffect(() => {
    const trackIds = filteredItems.map((item) => item.id);
    if (trackIds.length > 0) {
      loadStats(trackIds);
    }
  }, [filteredItems, loadStats]);

  // Inject real statistics from Firestore
  const creatorItems = useMemo(() => {
    return filteredItems.map((item) => {
      const stats = getStatsForTrack(item.id);
      return {
        ...item,
        playCount: stats?.playCount ?? 0,
      };
    });
  }, [filteredItems, getStatsForTrack]);

  return (
    <ListPageLayout
      items={creatorItems}
      breadcrumbs={[
        { label: t("breadcrumb.home"), to: "/" },
        { label: t("breadcrumb.collections"), to: "/collections" },
        { label: creatorName },
      ]}
      title={creatorName}
      description={t("creator.works", { count: creatorItems.length })}
    />
  );
}
