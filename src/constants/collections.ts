import {
  FaDatabase,
  FaUsers,
  FaMicrochip,
  FaCode,
  FaHome,
  FaPencilAlt,
  FaHeart,
  FaMusic,
} from "react-icons/fa";
import type { IconType } from "react-icons";

import type { CollectionSlug } from "../utils/rtttl_parser";

export interface CollectionDef {
  slug: CollectionSlug;
  nameKey: string;
  descriptionKey: string;
  icon: IconType;
  source?: string;
  /** If true, clicking this collection opens the external source URL directly instead of navigating to /collections/:slug */
  externalOnly?: boolean;
  /** "my-creations" = user's own works; "public-libraries" = open-source RTTTL data collections; "external-links" = external reference links only */
  group: "my-creations" | "public-libraries" | "external-links";
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "my-creations",
    nameKey: "collections.myCreations.name",
    descriptionKey: "collections.myCreations.description",
    icon: FaPencilAlt,
    group: "my-creations",
  },
  {
    slug: "favorites",
    nameKey: "collections.favorites.name",
    descriptionKey: "collections.favorites.description",
    icon: FaHeart,
    group: "my-creations",
  },
  {
    slug: "community",
    nameKey: "collections.community.name",
    descriptionKey: "collections.community.description",
    icon: FaUsers,
    group: "public-libraries",
  },
  {
    slug: "esc-configurator",
    nameKey: "collections.escConfigurator.name",
    descriptionKey: "collections.escConfigurator.description",
    icon: FaMicrochip,
    source: "https://esc-configurator.com/",
    externalOnly: true,
    group: "external-links",
  },
  {
    slug: "picaxe",
    nameKey: "collections.picaxe.name",
    descriptionKey: "collections.picaxe.description",
    icon: FaDatabase,
    source: "https://picaxe.com/rtttl-ringtones-for-tune-command/",
    group: "public-libraries",
  },
  {
    slug: "skully-rtttl",
    nameKey: "collections.skullyRtttl.name",
    descriptionKey: "collections.skullyRtttl.description",
    icon: FaCode,
    source: "https://github.com/ImSkully/rtttl-web-composer",
    group: "public-libraries",
  },
  {
    slug: "esphome",
    nameKey: "collections.esphome.name",
    descriptionKey: "collections.esphome.description",
    icon: FaHome,
    source: "https://esphome.io/components/rtttl.html",
    group: "public-libraries",
  },
  {
    slug: "esctunes",
    nameKey: "collections.esctunes.name",
    descriptionKey: "collections.esctunes.description",
    icon: FaMusic,
    source: "http://esctunes.com/tunes",
    externalOnly: true,
    group: "external-links",
  },
];

export function getCollectionBySlug(slug: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
