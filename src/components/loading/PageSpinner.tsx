export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-primary animate-spin" />
        {label && <p className="text-sm">{label}</p>}
      </div>
    </div>
  );
}

