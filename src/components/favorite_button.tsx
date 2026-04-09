import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useFavoritesStore } from "@/stores/favorites_store";
import clsx from "clsx";

interface FavoriteButtonProps {
  itemId: string;
  size?: number;
}

export function FavoriteButton({ itemId, size = 18 }: FavoriteButtonProps) {
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFav = favoriteIds.includes(itemId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(itemId);
      }}
      className={clsx(
        "transition-colors hover:scale-110",
        isFav
          ? "text-red-500 hover:text-red-600"
          : "text-gray-400 hover:text-red-400 dark:text-gray-500",
      )}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      {isFav ? <FaHeart size={size} /> : <FaRegHeart size={size} />}
    </button>
  );
}
