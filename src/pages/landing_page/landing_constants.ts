import {
  FaDatabase,
  FaUsers,
  FaMusic,
  FaPlay,
  FaPlusCircle,
  FaGithub,
  FaHeadphones,
  FaGuitar,
  FaFilm,
  FaGamepad,
  FaSnowflake,
  FaGlobe,
  FaBaby,
  FaBell,
  FaStar,
} from "react-icons/fa";

export const COLLECTION_ILLUSTRATIONS: Record<
  string,
  { icon: React.ComponentType<{ size: number; className?: string }>; gradient: string }
> = {
  picaxe: { icon: FaDatabase, gradient: "from-indigo-600 via-purple-600 to-pink-500" },
  community: { icon: FaUsers, gradient: "from-emerald-500 via-teal-500 to-cyan-500" },
};

export const FEATURES = [
  {
    icon: FaMusic,
    titleKey: "landing.features.browse.title",
    descKey: "landing.features.browse.description",
  },
  {
    icon: FaPlay,
    titleKey: "landing.features.play.title",
    descKey: "landing.features.play.description",
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
  { id: "rock", icon: FaGuitar, gradient: "from-red-500 to-orange-500" },
  { id: "classical", icon: FaMusic, gradient: "from-amber-500 to-yellow-500" },
  { id: "movie-tv", icon: FaFilm, gradient: "from-purple-500 to-indigo-500" },
  { id: "game", icon: FaGamepad, gradient: "from-emerald-500 to-teal-500" },
  { id: "holiday", icon: FaSnowflake, gradient: "from-cyan-500 to-blue-500" },
  { id: "folk", icon: FaGlobe, gradient: "from-lime-500 to-green-500" },
  { id: "nursery", icon: FaBaby, gradient: "from-violet-500 to-purple-500" },
  { id: "alert", icon: FaBell, gradient: "from-orange-500 to-amber-500" },
  { id: "original", icon: FaStar, gradient: "from-indigo-500 to-blue-500" },
] as const;
