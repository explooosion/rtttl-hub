import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCollectionStore } from "@/stores/collection_store";
import { ListPageLayout } from "@/components/list_page_layout";

export function CreatorPage() {
  const { t } = useTranslation();
  const { creatorId } = useParams<{ creatorId: string }>();
  const items = useCollectionStore((s) => s.items);
  const userItems = useCollectionStore((s) => s.userItems);

  const creatorName = creatorId ? decodeURIComponent(creatorId) : "";

  const creatorItems = useMemo(() => {
    return [...items, ...userItems].filter((item) => item.artist === creatorName);
  }, [items, userItems, creatorName]);

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
