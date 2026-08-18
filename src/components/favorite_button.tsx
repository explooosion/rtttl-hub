import { FaHeart, FaRegHeart } from "react-icons/fa";
import clsx from "clsx";

import { useFavoritesStore } from "../stores/favorites_store";
import { useAuthStore } from "../stores/auth_store";

interface FavoriteButtonProps {
  itemId: string;
  size?: number;
}

export function FavoriteButton({ itemId, size = 18 }: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFav = favoriteIds.includes(itemId);

  function handleToggleFavorite(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    toggleFavorite(itemId, user?.uid);
  }

  return (
    <button
      onClick={handleToggleFavorite}
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
