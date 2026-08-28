import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCollectionStore } from "../stores/collection_store";
import { useTrackStatsStore } from "../stores/track_stats_store";
import { getUserDisplayName } from "../services/user_profile_service";
import { ListPageLayout } from "../layouts/list_page_layout";

export function CreatorPage() {
  const { t } = useTranslation();
  const { creatorId } = useParams<{ creatorId: string }>();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const loadStats = useTrackStatsStore((s) => s.loadStats);
  const getStatsForTrack = useTrackStatsStore((s) => s.getStatsForTrack);
  const [uidDisplayName, setUidDisplayName] = useState("");

  const decodedName = creatorId ? decodeURIComponent(creatorId) : "";

  // Match user-published tracks by their stable userId first; only fall back
  // to matching static-collection tracks by artist name if no userId matches.
  const filteredItems = useMemo(() => {
    if (!creatorId) {
      return [];
    }
    const allItems = [...items, ...userItems];
    const byUserId = allItems.filter((item) => item.userId === creatorId);
    if (byUserId.length > 0) {
      return byUserId;
    }
    return allItems.filter((item) => !item.userId && item.artist === decodedName);
  }, [items, userItems, creatorId, decodedName]);

  const isUidMatch = filteredItems.length > 0 && Boolean(filteredItems[0]!.userId);

  useEffect(
    function fetchCreatorDisplayName() {
      if (isUidMatch && creatorId) {
        getUserDisplayName(creatorId).then(setUidDisplayName);
      }
    },
    [isUidMatch, creatorId],
  );

  const creatorName = isUidMatch ? uidDisplayName : decodedName;

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
