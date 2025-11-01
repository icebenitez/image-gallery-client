export function Skeleton () {
  return <div className="aspect-square rounded-lg bg-muted animate-pulse" />
}

export default function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  )
}
