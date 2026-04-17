"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FeatureFlags {
  [key: string]: boolean;
}

interface FlagsResponse {
  flags: FeatureFlags;
  error?: string;
}

const FLAG_LABELS: Record<string, { label: string; description: string }> = {
  dark_mode: {
    label: "Dark Mode",
    description: "Enable dark color scheme",
  },
  show_favorites: {
    label: "Show Favorites",
    description: "Display the favorites section",
  },
  show_exports: {
    label: "Show Exports",
    description: "Display the exports section",
  },
  show_page_views: {
    label: "Show Page Views",
    description: "Display the page views counter",
  },
  experimental_features: {
    label: "Experimental",
    description: "Enable experimental features",
  },
};

async function fetchFlags(): Promise<FeatureFlags> {
  const res = await fetch("/api/flags");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as FlagsResponse;
  if (data.error) throw new Error(data.error);
  return data.flags;
}

async function toggleFlag(flag: string, value: boolean): Promise<void> {
  const res = await fetch("/api/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flag, value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["featureFlags"],
    queryFn: fetchFlags,
    staleTime: 30000,
  });
}

export default function FeatureFlagsSection() {
  const queryClient = useQueryClient();
  const { data: flags, isLoading, error } = useFeatureFlags();

  const toggleMutation = useMutation({
    mutationFn: ({ flag, value }: { flag: string; value: boolean }) =>
      toggleFlag(flag, value),
    onMutate: async ({ flag, value }) => {
      await queryClient.cancelQueries({ queryKey: ["featureFlags"] });
      const previous = queryClient.getQueryData<FeatureFlags>(["featureFlags"]);
      queryClient.setQueryData<FeatureFlags>(["featureFlags"], (old) => ({
        ...old,
        [flag]: value,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["featureFlags"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["featureFlags"] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🚩</span> Feature Flags
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>🚩</span> Feature Flags
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load flags"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🚩</span> Feature Flags
      </h3>

      <div className="space-y-3">
        {Object.entries(flags || {}).map(([key, value]) => {
          const config = FLAG_LABELS[key] || { label: key, description: "" };
          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {config.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {config.description}
                </p>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ flag: key, value: !value })}
                disabled={toggleMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value
                    ? "bg-indigo-600"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare KV (FLAGS namespace)
      </p>
    </div>
  );
}
