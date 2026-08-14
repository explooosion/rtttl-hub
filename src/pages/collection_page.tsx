import { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlus, FaEdit, FaTrash, FaHeart, FaFileImport } from "react-icons/fa";

import { generateMockStats } from "../types/track_stats";
import { ListPageLayout } from "../layouts/list_page_layout";
import type { BreadcrumbItem } from "../layouts/list_page_layout";
import { useCollectionStore } from "../stores/collection_store";
import { useFavoritesStore } from "../stores/favorites_store";
import { useAuthStore } from "../stores/auth_store";
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
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RtttlEntry | null>(null);

  const collectionDef = slug ? getCollectionBySlug(slug) : undefined;

  const collectionItems = useMemo(() => {
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
      filtered = [...items.filter((item) => item.collection === "community"), ...userItems];
    } else {
      filtered = [...items, ...userItems].filter(
        (item) => item.collection === (slug as CollectionSlug),
      );
    }

    // Inject mock statistics for development (will be replaced with Firestore data)
    return filtered.map((item) => {
      const mockStats = generateMockStats(item.id);
      return {
        ...item,
        playCount: mockStats.playCount,
        likeCount: mockStats.likeCount,
      };
    });
  }, [slug, items, userItems, favoriteIds]);

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
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, user, deleteUserItem]);

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

  return (
    <>
      <ListPageLayout
        items={collectionItems}
        breadcrumbs={breadcrumbs}
        title={collectionDef ? t(collectionDef.nameKey) : undefined}
        description={collectionDef ? t(collectionDef.descriptionKey) : undefined}
        source={collectionDef?.source}
        headerActions={headerActions}
        extraRowActions={extraActions}
        emptyNode={emptyNode}
      />
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={t("actions.deleteConfirmTitle")}
        message={t("actions.deleteConfirmMessage")}
        confirmLabel={t("actions.delete")}
        cancelLabel={t("actions.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        variant="danger"
      />
    </>
  );
}
