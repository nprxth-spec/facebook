export function TableSkeleton() {
  return (
    <div className="w-full border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800" />
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900/30"
          >
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

