import React from "react";

// Individual KPI Card Skeleton
export const KPISkeleton = () => {
  return (
    <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-2.5 bg-border-color rounded w-1/3"></div>
          <div className="h-6 bg-border-color rounded w-2/3 mt-2"></div>
        </div>
        <div className="w-11 h-11 bg-border-color rounded-lg shrink-0"></div>
      </div>
    </div>
  );
};

// Full Dashboard Loading Skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-border-color rounded w-1/4"></div>
        <div className="h-4 bg-border-color rounded w-1/3 mt-2"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
        <KPISkeleton />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Actions Skeleton */}
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-border-color rounded w-1/5 mb-3"></div>
            <div className="h-3 bg-border-color rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-bg-main/50 border border-border-color/40 rounded-xl p-4.5 flex flex-col items-center justify-center h-24">
                  <div className="w-10 h-10 bg-border-color rounded-lg mb-2"></div>
                  <div className="h-3 bg-border-color rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions Skeleton */}
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-border-color rounded w-1/4 mb-3"></div>
            <div className="h-3 bg-border-color rounded w-1/3 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-bg-main/30 border border-border-color/60 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-border-color rounded w-1/3"></div>
                    <div className="h-2.5 bg-border-color rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-border-color rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side (1/3 width) */}
        <div className="space-y-6">
          {/* Business Health Skeleton */}
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-border-color rounded w-1/3 mb-5"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-main/30 border border-border-color/60 rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div className="h-3 bg-border-color rounded w-1/2"></div>
                  <div className="h-3 bg-border-color rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Skeleton */}
          <div className="bg-bg-card border border-border-color rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 bg-border-color rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-border-color rounded w-1/3"></div>
                <div className="h-2.5 bg-border-color rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-rose-500/5 border border-border-color/40 rounded-xl px-4 py-4 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-border-color rounded w-1/2"></div>
                    <div className="h-2.5 bg-border-color rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-border-color rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="bg-bg-card border border-border-color rounded-xl overflow-hidden shadow-sm animate-pulse">
      {/* Table Header mock */}
      <div className="bg-bg-main/60 border-b border-border-color px-5 py-4 flex justify-between">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-border-color rounded w-16"></div>
        ))}
      </div>
      {/* Table Body mock */}
      <div className="divide-y divide-border-color/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-5 flex justify-between items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`h-3 bg-border-color rounded ${
                  c === 0 ? "w-28 font-bold" : c === cols - 1 ? "w-12" : "w-20"
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
