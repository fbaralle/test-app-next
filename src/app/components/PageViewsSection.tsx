"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface PageViewsData {
  totalViews: number;
  uniqueVisitors: number;
}

interface PageViewsResponse extends PageViewsData {
  error?: string;
}

interface TrackResponse {
  success: boolean;
  totalViews: number;
  isNewVisitor: boolean;
  visitorId: string;
}

const VISITOR_ID_KEY = "crypto_dashboard_visitor_id";

function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VISITOR_ID_KEY);
}

function setVisitorId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VISITOR_ID_KEY, id);
}

async function fetchPageViews(): Promise<PageViewsData> {
  const res = await fetch("/api/pageviews");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as PageViewsResponse;
  if (data.error) throw new Error(data.error);
  return { totalViews: data.totalViews, uniqueVisitors: data.uniqueVisitors };
}

async function trackPageView(visitorId: string | null): Promise<TrackResponse> {
  const res = await fetch("/api/pageviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function PageViewsSection() {
  const [tracked, setTracked] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pageViews"],
    queryFn: fetchPageViews,
    staleTime: 10000,
  });

  const trackMutation = useMutation({
    mutationFn: () => trackPageView(getVisitorId()),
    onSuccess: (result) => {
      if (result.visitorId) {
        setVisitorId(result.visitorId);
      }
      setTracked(true);
      refetch();
    },
  });

  // Track page view on mount (only once)
  useEffect(() => {
    if (!tracked && !trackMutation.isPending) {
      trackMutation.mutate();
    }
  }, [tracked, trackMutation]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>👁️</span> Page Views
        </h3>
        <div className="animate-pulse flex gap-6">
          <div className="h-16 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-16 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>👁️</span> Page Views
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load page views"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>👁️</span> Page Views
      </h3>

      <div className="flex gap-6">
        <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {data?.totalViews.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total Views
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg flex-1">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data?.uniqueVisitors.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Unique Visitors
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Stored in Cloudflare KV (SESSIONS namespace) • Unique visitors tracked for 24h
      </p>
    </div>
  );
}
