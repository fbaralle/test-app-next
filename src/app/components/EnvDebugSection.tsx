"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface EnvDebugResponse {
  envVars: string[];
  totalCount: number;
  hiddenCount: number;
  timestamp: string;
}

const basePath = process.env.__NEXT_ROUTER_BASEPATH || "";

// Get frontend env var names (Next.js exposes these at build time)
function getFrontendEnvVars(): string[] {
  if (typeof window === "undefined") return [];

  // In Next.js, public env vars are available via process.env
  // We can check for common patterns
  const envVars: string[] = [];

  // Check known Next.js env patterns
  const knownVars = [
    "__NEXT_ROUTER_BASEPATH",
    "NODE_ENV",
  ];

  for (const key of knownVars) {
    if (process.env[key] !== undefined) {
      envVars.push(key);
    }
  }

  return envVars.sort();
}

async function fetchBackendEnv(): Promise<EnvDebugResponse> {
  const res = await fetch(`${basePath}/api/env-debug`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface Props {
  compact?: boolean;
}

export default function EnvDebugSection({ compact }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const frontendEnvVars = getFrontendEnvVars();

  const { data, isLoading, error } = useQuery({
    queryKey: ["envDebug"],
    queryFn: fetchBackendEnv,
    staleTime: 60000,
    retry: false,
  });

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Env Vars</span>
            <span className="text-xs font-normal text-gray-400">(debug)</span>
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        </div>

        {!isExpanded ? (
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Frontend:</span>{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {frontendEnvVars.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Backend:</span>{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {isLoading ? "..." : data?.envVars.length || 0}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Frontend ({frontendEnvVars.length}):</p>
              <div className="flex flex-wrap gap-1">
                {frontendEnvVars.map((name) => (
                  <code
                    key={name}
                    className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {name}
                  </code>
                ))}
                {frontendEnvVars.length === 0 && (
                  <span className="text-gray-400 italic">none detected</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">
                Backend ({data?.envVars.length || 0}
                {data?.hiddenCount ? `, ${data.hiddenCount} hidden` : ""}):
              </p>
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : error ? (
                <span className="text-red-500">Error loading</span>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {data?.envVars.map((name) => (
                    <code
                      key={name}
                      className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                    >
                      {name}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        Environment Variables
        <span className="text-sm font-normal text-gray-400">(names only, no values)</span>
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
            Frontend ({frontendEnvVars.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {frontendEnvVars.map((name) => (
              <code
                key={name}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
              >
                {name}
              </code>
            ))}
            {frontendEnvVars.length === 0 && (
              <span className="text-gray-400 italic text-sm">none detected</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
            Backend ({data?.envVars.length || 0})
            {data?.hiddenCount ? (
              <span className="font-normal text-gray-500 ml-2">
                ({data.hiddenCount} sensitive vars hidden)
              </span>
            ) : null}
          </h4>
          {isLoading ? (
            <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ) : error ? (
            <p className="text-red-500 text-sm">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {data?.envVars.map((name) => (
                <code
                  key={name}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm"
                >
                  {name}
                </code>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Shows environment variable names available at runtime (values hidden for security)
      </p>
    </div>
  );
}
