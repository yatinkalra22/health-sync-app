export default function PADetailLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back button skeleton */}
      <div className="h-5 w-40 shimmer rounded mb-6" />

      {/* Header skeleton */}
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-32 shimmer rounded" />
              <div className="h-6 w-28 shimmer rounded-full" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-24 shimmer rounded" />
              <div className="h-4 w-20 shimmer rounded" />
              <div className="h-4 w-24 shimmer rounded" />
            </div>
          </div>
          <div className="h-14 w-14 shimmer rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6 h-48 shimmer" />
          <div className="glass-card rounded-xl p-6 h-64 shimmer" />
        </div>
        <div>
          <div className="glass-card rounded-xl p-6 h-80 shimmer" />
        </div>
      </div>
    </div>
  );
}
