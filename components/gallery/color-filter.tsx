"use client"

const COLORS = [
  { name: "Red", value: "red", hex: "#ef4444" },
  { name: "Orange", value: "orange", hex: "#f97316" },
  { name: "Yellow", value: "yellow", hex: "#eab308" },
  { name: "Green", value: "green", hex: "#22c55e" },
  { name: "Blue", value: "blue", hex: "#3b82f6" },
  { name: "Purple", value: "purple", hex: "#a855f7" },
  { name: "Pink", value: "pink", hex: "#ec4899" },
]

interface ColorFilterProps {
  selectedColor: string | null
  onColorChange: (color: string | null) => void
}

export default function ColorFilter({ selectedColor, onColorChange }: ColorFilterProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      <button
        onClick={() => onColorChange(null)}
        className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
          selectedColor === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onColorChange(color.value)}
          className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
            selectedColor === color.value ? "ring-2 ring-offset-2 ring-foreground" : ""
          }`}
          style={{ backgroundColor: color.hex }}
          title={color.name}
        />
      ))}
    </div>
  )
}
