export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-9 w-full rounded-lg bg-gray-100 dark:bg-gray-900" />
        </div>
      ))}
      <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

