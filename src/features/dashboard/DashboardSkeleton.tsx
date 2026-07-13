export function DashboardSkeleton() {
  return (
    <div className="flex w-full max-w-2xl animate-pulse flex-col gap-4">
      <div className="h-6 w-40 rounded bg-neutral-200" />
      <div className="h-16 w-full rounded-md bg-neutral-100" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-md bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
