export default function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-square rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
