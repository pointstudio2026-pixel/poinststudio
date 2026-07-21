export function DashboardSkeleton() {
  return (
    <div className="flex w-full max-w-2xl animate-pulse flex-col gap-4">
      <div className="h-6 w-40 rounded-full bg-line" />
      <div className="h-16 w-full rounded-2xl bg-surface" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
