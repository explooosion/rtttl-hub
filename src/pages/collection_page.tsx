import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaHeart, FaFileImport, FaGlobe, FaLock } from "react-icons/fa";

import { ListPageLayout } from "../layouts/list_page_layout";
import type { BreadcrumbItem } from "../layouts/list_page_layout";
import { useCollectionStore } from "../stores/collection_store";
import { useFavoritesStore } from "../stores/favorites_store";
import { useAuthStore } from "../stores/auth_store";
import { usePlayerStore } from "../stores/player_store";
import { useTrackStatsStore } from "../stores/track_stats_store";
import { updateCreationVisibility, getPublicCreations } from "../services/firestore_service";
import { getCollectionBySlug, COLLECTIONS } from "../constants/collections";
import type { CollectionSlug, RtttlEntry } from "../utils/rtttl_parser";
import type { TrackRowAction } from "../components/track_row";
import { ConfirmDialog } from "../components/confirm_dialog";

/** Triggers create-page chunk download on hover/focus, before the user clicks. */
const preloadCreatePage = () => {
  void import("../pages/create_page");
};

export function CollectionPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);
  const deleteUserItem = useCollectionStore((s) => s.deleteUserItem);
  const updateUserItem = useCollectionStore((s) => s.updateUserItem);
  const sortMode = useCollectionStore((s) => s.sortMode);
  const setSortMode = useCollectionStore((s) => s.setSortMode);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const currentItem = usePlayerStore((s) => s.currentItem);
  const clearCurrentItem = usePlayerStore((s) => s.clearCurrentItem);
  const loadStats = useTrackStatsStore((s) => s.loadStats);
  const getStatsForTrack = useTrackStatsStore((s) => s.getStatsForTrack);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RtttlEntry | null>(null);
  const [publicCreations, setPublicCreations] = useState<RtttlEntry[]>([]);
  const [publicCreationsLoadedFor, setPublicCreationsLoadedFor] = useState<string | null>(null);

  const collectionDef = slug ? getCollectionBySlug(slug) : undefined;
  const isCommunityLoading = slug === "community" && publicCreationsLoadedFor !== slug;

  // Set default sort mode for my-creations and community
  useEffect(() => {
    if (slug === "my-creations" || slug === "community") {
      if (sortMode !== "updated-desc" && sortMode !== "updated-asc") {
        setSortMode("updated-desc");
      }
    }
  }, [slug, sortMode, setSortMode]);

  // Load public creations for community collection
  useEffect(() => {
    if (slug === "community") {
      getPublicCreations()
        .then((creations) => {
          setPublicCreations(creations);
        })
        .catch((error) => {
          console.error("Failed to load public creations:", error);
        })
        .finally(() => {
          setPublicCreationsLoadedFor(slug);
        });
    }
  }, [slug]);

  // Filter items based on current collection (without stats)
  const filteredItems = useMemo(() => {
    let filtered: RtttlEntry[];
    if (!slug) {
      filtered = [...items, ...userItems];
    } else if (slug === "favorites") {
      const allItems = [...items, ...userItems];
      const idSet = new Set(favoriteIds);
      filtered = allItems.filter((item) => idSet.has(item.id));
    } else if (slug === "public") {
      // Virtual collection: aggregate all public-libraries collections
      const publicLibrarySlugs = COLLECTIONS.filter((c) => c.group === "public-libraries").map(
        (c) => c.slug,
      );
      filtered = items.filter((item) => publicLibrarySlugs.includes(item.collection));
    } else if (slug === "picaxe") {
      filtered = items.filter((item) => item.collection === (slug as CollectionSlug));
    } else if (slug === "community") {
      // Include original community items and public user creations
      const originalCommunity = items.filter((item) => item.collection === "community");
      filtered = [...originalCommunity, ...publicCreations];
    } else {
      filtered = [...items, ...userItems].filter(
        (item) => item.collection === (slug as CollectionSlug),
      );
    }
    return filtered;
  }, [slug, items, userItems, favoriteIds, publicCreations]);

  // Load statistics when filtered items change
  useEffect(() => {
    const trackIds = filteredItems.map((item) => item.id);
    if (trackIds.length > 0) {
      loadStats(trackIds);
    }
  }, [filteredItems, loadStats]);

  // Inject real statistics from Firestore
  const collectionItems = useMemo(() => {
    return filteredItems.map((item) => {
      const stats = getStatsForTrack(item.id);
      return {
        ...item,
        playCount: stats?.playCount ?? 0,
      };
    });
  }, [filteredItems, getStatsForTrack]);

  const handleCreateNew = useCallback(() => {
    navigate("/create");
  }, [navigate]);

  const handleEditItem = useCallback(
    (item: RtttlEntry) => {
      navigate(`/create?edit=${item.id}`);
    },
    [navigate],
  );

  const handleDeleteItem = useCallback((item: RtttlEntry) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (itemToDelete) {
      deleteUserItem(itemToDelete.id, user?.uid);
      if (currentItem?.id === itemToDelete.id) {
        clearCurrentItem();
      }
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, user, deleteUserItem, currentItem, clearCurrentItem]);

  const handleImportToCreate = useCallback(
    (item: RtttlEntry) => {
      // Navigate to create page with track data
      navigate("/create", {
        state: {
          importTrack: {
            title: item.title,
            artist: item.artist,
            code: item.code,
            tracks: item.tracks,
            categories: item.categories,
          },
        },
      });
    },
    [navigate],
  );

  const handleTogglePublic = useCallback(
    async (item: RtttlEntry) => {
      if (!user) {
        return;
      }
      const newIsPublic = !item.isPublic;
      try {
        // Update Firestore
        await updateCreationVisibility(item.id, newIsPublic);

        // Update local state
        const updatedItem = {
          ...item,
          isPublic: newIsPublic,
          updatedAt: new Date().toISOString(),
        };
        updateUserItem(item.id, updatedItem, user.uid);

        // Show notification
        toast.success(
          newIsPublic
            ? t("create.nowPublic", { name: item.title })
            : t("create.nowPrivate", { name: item.title }),
        );
      } catch (error) {
        console.error("Failed to toggle visibility:", error);
        toast.error(t("create.visibilityUpdateFailed"));
      }
    },
    [user, updateUserItem, t],
  );

  const pinnedRowAction: TrackRowAction | undefined = useMemo(() => {
    if (slug !== "my-creations") {
      return undefined;
    }
    return {
      icon: (item: RtttlEntry) =>
        item.isPublic ? (
          <FaGlobe size={18} className="text-green-500" />
        ) : (
          <FaLock size={18} className="text-gray-400" />
        ),
      title: (item: RtttlEntry) =>
        item.isPublic ? t("actions.makePrivate") : t("actions.makePublic"),
      onClick: handleTogglePublic,
    };
  }, [slug, t, handleTogglePublic]);

  const extraActions: TrackRowAction[] | undefined = useMemo(() => {
    if (slug === "my-creations") {
      return [
        {
          icon: <FaEdit size={18} />,
          title: t("actions.edit"),
          onClick: handleEditItem,
        },
        {
          icon: <FaTrash size={18} />,
          title: t("actions.delete"),
          onClick: handleDeleteItem,
          variant: "danger" as const,
        },
      ];
    }
    // For all other collections, show import button
    return [
      {
        icon: <FaFileImport size={18} />,
        title: t("actions.importToCreate"),
        onClick: handleImportToCreate,
      },
    ];
  }, [slug, t, handleEditItem, handleDeleteItem, handleImportToCreate]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("breadcrumb.home"), to: "/" },
    { label: t("breadcrumb.collections"), to: "/collections" },
    ...(collectionDef ? [{ label: t(collectionDef.nameKey) }] : []),
  ];

  const emptyNode =
    slug === "favorites" ? (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
        <FaHeart size={48} className="opacity-50" />
        <p className="text-center">{t("favorites.empty")}</p>
      </div>
    ) : undefined;

  const headerActions =
    slug === "community" || slug === "my-creations" ? (
      <button
        onClick={handleCreateNew}
        onMouseEnter={preloadCreatePage}
        onFocus={preloadCreatePage}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <FaPlus size={16} />
        <span className="hidden sm:inline">{t("actions.createNew")}</span>
      </button>
    ) : undefined;

  function handleCloseDeleteConfirm() {
    setDeleteConfirmOpen(false);
  }

  return (
    <>
      <ListPageLayout
        items={collectionItems}
        isLoading={isCommunityLoading}
        breadcrumbs={breadcrumbs}
        title={collectionDef ? t(collectionDef.nameKey) : undefined}
        description={collectionDef ? t(collectionDef.descriptionKey) : undefined}
        source={collectionDef?.source}
        headerActions={headerActions}
        extraRowActions={extraActions}
        showActionsAsMenu={slug === "my-creations"}
        pinnedRowAction={pinnedRowAction}
        emptyNode={emptyNode}
      />
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={t("actions.deleteConfirmTitle")}
        message={t("actions.deleteConfirmMessage")}
        confirmLabel={t("actions.delete")}
        cancelLabel={t("actions.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteConfirm}
        variant="danger"
      />
    </>
  );
}
