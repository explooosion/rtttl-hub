import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCollectionStore } from "../stores/collection_store";
import { useTrackStatsStore } from "../stores/track_stats_store";
import { getUserDisplayName, getCachedUserDisplayName } from "../services/user_profile_service";
import { getPublicCreationsByUser } from "../services/firestore_service";
import type { RtttlEntry } from "../utils/rtttl_parser";
import { ListPageLayout } from "../layouts/list_page_layout";

export function CreatorPage() {
  const { t } = useTranslation();
  const { creatorId } = useParams<{ creatorId: string }>();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const loadStats = useTrackStatsStore((s) => s.loadStats);
  const statsCache = useTrackStatsStore((s) => s.statsCache);
  const [uidDisplayName, setUidDisplayName] = useState("");
  const [remoteCreatorItems, setRemoteCreatorItems] = useState<RtttlEntry[]>([]);
  const [remoteFetchDone, setRemoteFetchDone] = useState(false);

  const decodedName = creatorId ? decodeURIComponent(creatorId) : "";

  // The local store only holds the *current* user's own creations — another
  // creator's public tracks must be fetched directly from Firestore so they
  // show up here the same way they do on the public/community collection page.
  useEffect(
    function fetchRemoteCreatorItemsWhenCreatorIdChanges() {
      if (!creatorId) {
        return;
      }
      let cancelled = false;
      getPublicCreationsByUser(creatorId).then((remoteItems) => {
        if (!cancelled) {
          setRemoteCreatorItems(remoteItems);
          setRemoteFetchDone(true);
        }
      });
      return () => {
        cancelled = true;
      };
    },
    [creatorId],
  );

  // Match user-published tracks by their stable userId first; only fall back
  // to matching static-collection tracks by artist name if no userId matches.
  const filteredItems = useMemo(() => {
    if (!creatorId) {
      return [];
    }
    const merged = new Map<string, RtttlEntry>();
    for (const item of [...items, ...userItems, ...remoteCreatorItems]) {
      merged.set(item.id, item);
    }
    const allItems = [...merged.values()];
    const byUserId = allItems.filter((item) => item.userId === creatorId);
    if (byUserId.length > 0) {
      return byUserId;
    }
    return allItems.filter((item) => !item.userId && item.artist === decodedName);
  }, [items, userItems, remoteCreatorItems, creatorId, decodedName]);

  const isUidMatch =
    (creatorId ? getCachedUserDisplayName(creatorId) !== undefined : false) ||
    (filteredItems.length > 0 && Boolean(filteredItems[0]!.userId));

  useEffect(
    function fetchCreatorDisplayName() {
      if (isUidMatch && creatorId) {
        getUserDisplayName(creatorId, setUidDisplayName).then(setUidDisplayName);
      }
    },
    [isUidMatch, creatorId],
  );

  const creatorName = isUidMatch
    ? uidDisplayName ||
      (creatorId ? getCachedUserDisplayName(creatorId) : undefined) ||
      t("common.loadingProfile", { defaultValue: "Loading profile..." })
    : !creatorId || remoteFetchDone
      ? decodedName
      : t("common.loadingProfile", { defaultValue: "Loading profile..." });

  // Load statistics when filtered items change
  useEffect(() => {
    const trackIds = filteredItems.map((item) => item.id);
    if (trackIds.length > 0) {
      loadStats(trackIds);
    }
  }, [filteredItems, loadStats]);

  // Inject real statistics from Firestore — leave playCount undefined (not 0)
  // while a fetch is still in flight, so TrackRow doesn't flash a false zero.
  // Reads statsCache directly (rather than via a store action) so this
  // recomputes once the async stats fetch resolves.
  const creatorItems = useMemo(() => {
    return filteredItems.map((item) => {
      const stats = statsCache.get(item.id);
      return {
        ...item,
        playCount: stats ? stats.playCount + stats.localPlayIncrement : undefined,
      };
    });
  }, [filteredItems, statsCache]);

  return (
    <ListPageLayout
      items={creatorItems}
      isLoading={Boolean(creatorId) && !remoteFetchDone && filteredItems.length === 0}
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
