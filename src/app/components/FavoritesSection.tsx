"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Favorite {
  id: number;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

interface FavoritesResponse {
  favorites: Favorite[];
  error?: string;
}

const basePath = process.env.PUBLIC_API_MOUNT_PATH || "";

async function fetchFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${basePath}/api/favorites`);
  const data = (await res.json()) as FavoritesResponse;
  // Return empty array for 503 (binding not available) - show as "no favorites" not error
  if (res.status === 503) {
    return data.favorites || [];
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (data.error) throw new Error(data.error);
  return data.favorites;
}

async function removeFavorite(coinId: string): Promise<void> {
  const res = await fetch(`${basePath}/api/favorites?coin_id=${coinId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    staleTime: 10000,
    retry: false,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coin: { id: string; name: string; symbol: string; image: string }) => {
      const res = await fetch(`${basePath}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin_id: coin.id,
          coin_name: coin.name,
          coin_symbol: coin.symbol,
          coin_image: coin.image,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export default function FavoritesSection() {
  const { data: favorites = [], isLoading, error } = useFavorites();
  const removeMutation = useRemoveFavorite();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-yellow-500">★</span> Favorites
        </h3>
        <div className="animate-pulse flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="text-yellow-500">★</span> Favorites
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load favorites"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          D1 database may not be available. Check the healthcheck toolbar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-yellow-500">★</span> Favorites
        <span className="text-sm font-normal text-gray-500">
          ({favorites.length} coin{favorites.length !== 1 ? "s" : ""})
        </span>
      </h3>

      {favorites.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No favorites yet. Click the star icon on any coin to add it here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {favorites.map((fav) => (
            <div
              key={fav.coin_id}
              className="group relative flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors"
            >
              {fav.coin_image && (
                <img
                  src={fav.coin_image}
                  alt={fav.coin_name || fav.coin_id}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {fav.coin_name || fav.coin_id}
                </p>
                {fav.coin_symbol && (
                  <p className="text-xs text-gray-500 uppercase">{fav.coin_symbol}</p>
                )}
              </div>
              <button
                onClick={() => removeMutation.mutate(fav.coin_id)}
                disabled={removeMutation.isPending}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from favorites"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare D1 database • Public favorites (shared by all users)
      </p>
    </div>
  );
}
