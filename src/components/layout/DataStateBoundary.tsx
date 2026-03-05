import React from "react";

interface DataStateBoundaryProps {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  errorFallback?: (msg: string) => React.ReactNode;
  children: React.ReactNode;
}

export function DataStateBoundary({
  loading,
  error,
  empty,
  loadingFallback,
  emptyFallback,
  errorFallback,
  children,
}: DataStateBoundaryProps) {
  if (loading) {
    return (
      (loadingFallback as React.ReactNode) ?? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          Loading...
        </div>
      )
    );
  }

  if (error) {
    if (errorFallback) return errorFallback(error);
    return (
      <div className="flex items-center justify-center py-10 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (empty) {
    if (emptyFallback) return emptyFallback;
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-400">
        No data.
      </div>
    );
  }

  return <>{children}</>;
}

