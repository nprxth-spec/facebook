export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-gray-900" />
        </div>
        <div className="h-8 w-40 rounded-full bg-gray-100 dark:bg-gray-900" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-[1rem] border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="h-3 w-16 rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-6 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 shadow-sm">
          <div className="h-4 w-32 rounded-lg bg-gray-200 dark:bg-gray-800 mb-2" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-900" />
                </div>
                <div className="w-16 h-4 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 shadow-sm">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>

          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 shadow-sm">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-900" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 shadow-sm">
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="h-3 w-10 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

