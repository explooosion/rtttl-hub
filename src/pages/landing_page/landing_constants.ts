import {
  FaDatabase,
  FaUsers,
  FaMusic,
  FaMicrophone,
  FaPlusCircle,
  FaGithub,
  FaHeadphones,
  FaFilm,
  FaGamepad,
  FaSnowflake,
  FaGlobe,
  FaBell,
  FaStar,
  FaCode,
  FaHome,
  FaMicrochip,
} from "react-icons/fa";

export const COLLECTION_ILLUSTRATIONS: Record<
  string,
  { icon: React.ComponentType<{ size: number; className?: string }>; gradient: string }
> = {
  picaxe: { icon: FaDatabase, gradient: "from-indigo-600 via-purple-600 to-pink-500" },
  community: { icon: FaUsers, gradient: "from-emerald-500 via-teal-500 to-cyan-500" },
  "skully-rtttl": { icon: FaCode, gradient: "from-blue-600 via-sky-600 to-cyan-600" },
  esphome: { icon: FaHome, gradient: "from-orange-500 via-red-500 to-pink-500" },
  "esc-configurator": {
    icon: FaMicrochip,
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
  },
  esctunes: { icon: FaMusic, gradient: "from-lime-500 via-green-500 to-emerald-600" },
};

export const FEATURES = [
  {
    icon: FaMusic,
    titleKey: "landing.features.browse.title",
    descKey: "landing.features.browse.description",
  },
  {
    icon: FaMicrophone,
    titleKey: "landing.features.aiRecognition.title",
    descKey: "landing.features.aiRecognition.description",
  },
  {
    icon: FaPlusCircle,
    titleKey: "landing.features.create.title",
    descKey: "landing.features.create.description",
  },
  {
    icon: FaGithub,
    titleKey: "landing.features.openSource.title",
    descKey: "landing.features.openSource.description",
  },
] as const;

export const CATEGORY_ITEMS = [
  { id: "pop", icon: FaHeadphones, gradient: "from-pink-500 to-rose-500" },
  { id: "classical", icon: FaMusic, gradient: "from-amber-500 to-yellow-500" },
  { id: "movie-tv", icon: FaFilm, gradient: "from-purple-500 to-indigo-500" },
  { id: "game", icon: FaGamepad, gradient: "from-emerald-500 to-teal-500" },
  { id: "holiday", icon: FaSnowflake, gradient: "from-cyan-500 to-blue-500" },
  { id: "folk", icon: FaGlobe, gradient: "from-lime-500 to-green-500" },
  { id: "alert", icon: FaBell, gradient: "from-orange-500 to-amber-500" },
  { id: "original", icon: FaStar, gradient: "from-indigo-500 to-blue-500" },
] as const;
