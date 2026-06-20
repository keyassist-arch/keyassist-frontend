function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className ?? ""}`} />;
}

export function ProductDetailSkeleton() {
  return (
    <div className="pb-16">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2">
        <Bone className="h-3 w-10" />
        <span className="text-gray-200">/</span>
        <Bone className="h-3 w-40" />
      </div>

      {/* Two-column grid */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">

        {/* Left: gallery */}
        <div className="flex gap-3">
          {/* Thumbnail strip */}
          <div className="flex w-[60px] shrink-0 flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <Bone key={i} className="h-[60px] w-[60px] rounded-xl" />
            ))}
          </div>
          {/* Main image */}
          <Bone className="aspect-square min-w-0 flex-1 rounded-2xl" />
        </div>

        {/* Right: info panel */}
        <div className="space-y-5">
          {/* Eyebrow */}
          <Bone className="h-4 w-24" />

          {/* Title */}
          <div className="space-y-2">
            <Bone className="h-7 w-full" />
            <Bone className="h-7 w-3/4" />
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="h-4 w-4 rounded-full" />
              ))}
            </div>
            <Bone className="h-3.5 w-20" />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <Bone className="h-10 w-32" />
          </div>

          {/* Variant picker */}
          <div className="space-y-3">
            <Bone className="h-4 w-16" />
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="h-9 w-16 rounded-full" />
              ))}
            </div>
          </div>

          {/* Second variant picker */}
          <div className="space-y-3">
            <Bone className="h-4 w-12" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Bone key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          </div>

          {/* Quantity stepper */}
          <div className="space-y-3">
            <Bone className="h-4 w-16" />
            <Bone className="h-11 w-32 rounded-xl" />
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-1">
            <Bone className="h-12 w-full rounded-full" />
            <Bone className="h-12 w-full rounded-full" />
            <div className="flex gap-3">
              <Bone className="h-11 flex-1 rounded-full" />
              <Bone className="h-11 flex-1 rounded-full" />
            </div>
          </div>

          {/* Meta lines */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <Bone className="h-3.5 w-48" />
          </div>
        </div>
      </div>

      {/* Description tabs */}
      <div className="mt-14 border-t border-gray-100 pt-10">
        {/* Tab bar */}
        <div className="flex gap-2">
          <Bone className="h-9 w-32 rounded-full" />
          <Bone className="h-9 w-32 rounded-full" />
        </div>

        {/* Tab content */}
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-4 py-8 sm:px-8 sm:py-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <Bone className="h-5 w-36" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              <Bone className="h-5 w-24" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
