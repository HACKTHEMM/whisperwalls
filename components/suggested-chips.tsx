"use client"

import { Badge } from "@/components/ui/badge"

const CATEGORIES = ["Restaurants", "Hotels", "Things to do", "Museums", "Transit", "Pharmacies", "ATMs"]

export function SuggestedChips() {
  return (
    <div className="pointer-events-auto">
      <div className="chips-scroll flex w-full md:max-w-[min(640px,92vw)] snap-x items-center justify-start gap-2 overflow-x-auto rounded-full bg-background/90 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {CATEGORIES.map((label) => (
          <Badge
            key={label}
            variant="secondary"
            className="snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm"
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
