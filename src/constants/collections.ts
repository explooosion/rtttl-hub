import { FaDatabase, FaUsers, FaMicrochip, FaCode } from "react-icons/fa";
import type { IconType } from "react-icons";

import type { CollectionSlug } from "../utils/rtttl_parser";

export interface CollectionDef {
  slug: CollectionSlug;
  nameKey: string;
  descriptionKey: string;
  icon: IconType;
  source?: string;
  /** "community" = user-created; "library" = curated/brand datasets */
  group: "community" | "library";
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "community",
    nameKey: "collections.community.name",
    descriptionKey: "collections.community.description",
    icon: FaUsers,
    group: "community",
  },
  {
    slug: "esc-configurator",
    nameKey: "collections.escConfigurator.name",
    descriptionKey: "collections.escConfigurator.description",
    icon: FaMicrochip,
    source: "https://esc-configurator.com/",
    group: "library",
  },
  {
    slug: "picaxe",
    nameKey: "collections.picaxe.name",
    descriptionKey: "collections.picaxe.description",
    icon: FaDatabase,
    source: "https://picaxe.com/rtttl-ringtones-for-tune-command/",
    group: "library",
  },
  {
    slug: "skully-rtttl",
    nameKey: "collections.skullyRtttl.name",
    descriptionKey: "collections.skullyRtttl.description",
    icon: FaCode,
    source: "https://github.com/ImSkully/rtttl-web-composer",
    group: "library",
  },
];

export function getCollectionBySlug(slug: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
