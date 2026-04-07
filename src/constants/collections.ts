import type { CollectionSlug } from "@/utils/rtttl-parser";
import { FaDatabase, FaUsers } from "react-icons/fa";
import type { IconType } from "react-icons";

export interface CollectionDef {
  slug: CollectionSlug;
  nameKey: string;
  descriptionKey: string;
  icon: IconType;
  source?: string;
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "picaxe",
    nameKey: "collections.picaxe.name",
    descriptionKey: "collections.picaxe.description",
    icon: FaDatabase,
    source: "https://picaxe.com/rtttl-ringtones-for-tune-command/",
  },
  {
    slug: "community",
    nameKey: "collections.community.name",
    descriptionKey: "collections.community.description",
    icon: FaUsers,
  },
];

export function getCollectionBySlug(slug: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
