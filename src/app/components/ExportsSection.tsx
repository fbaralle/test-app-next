"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFavorites } from "./FavoritesSection";

interface Export {
  key: string;
  size: number;
  uploaded: string;
}

interface ExportsResponse {
  exports: Export[];
  error?: string;
}

interface ExportResult {
  success: boolean;
  id: string;
  url: string;
}

async function fetchExports(): Promise<Export[]> {
  const res = await fetch("/api/export");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ExportsResponse;
  if (data.error) throw new Error(data.error);
  return data.exports;
}

async function createExport(data: unknown): Promise<ExportResult> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export default function ExportsSection() {
  const queryClient = useQueryClient();
  const { data: favorites } = useFavorites();
  const { data: exports = [], isLoading, error, refetch } = useQuery({
    queryKey: ["exports"],
    queryFn: fetchExports,
    staleTime: 30000,
  });

  const exportMutation = useMutation({
    mutationFn: createExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports"] });
    },
  });

  const handleExportFavorites = () => {
    exportMutation.mutate({
      type: "favorites",
      title: "Favorites Export",
      exportedAt: new Date().toISOString(),
      favorites: favorites || [],
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📦</span> R2 Exports
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>📦</span> R2 Exports
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load exports"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📦</span> R2 Exports
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleExportFavorites}
            disabled={exportMutation.isPending || !favorites?.length}
            className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportMutation.isPending ? "Exporting..." : "Export Favorites"}
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {exportMutation.isSuccess && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Export created: <code className="font-mono">{exportMutation.data?.id}</code>
          </p>
        </div>
      )}

      {exports.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No exports yet. Click &quot;Export Favorites&quot; to create one.
        </p>
      ) : (
        <div className="space-y-2">
          {exports.map((exp) => (
            <div
              key={exp.key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {exp.key.replace("exports/", "")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(exp.uploaded)} • {formatBytes(exp.size)}
                </p>
              </div>
              <a
                href={`/api/export?id=${exp.key.replace("exports/", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare R2 (MEDIA bucket)
      </p>
    </div>
  );
}
