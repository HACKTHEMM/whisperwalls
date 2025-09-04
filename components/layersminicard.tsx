"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Layers, Check } from "lucide-react"

const MAP_STYLES = [
  { id: "streets-v12", name: "Streets", description: "Default street map" },
  { id: "satellite-v9", name: "Satellite", description: "Satellite imagery" },
  { id: "outdoors-v12", name: "Outdoors", description: "Topographic style" },
  { id: "light-v11", name: "Light", description: "Light themed map" },
  { id: "dark-v11", name: "Dark", description: "Dark themed map" },
]

interface LayersMiniCardProps {
  onStyleChange?: (styleId: string) => void
  currentStyle?: string
}

export default function LayersMiniCard({ onStyleChange, currentStyle = "streets-v12" }: LayersMiniCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute left-4 bottom-4 z-30 md:left-24 lg:left-28">
      {isOpen && (
        <Card className="absolute bottom-full mb-2 w-64 p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="space-y-1">
            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Map Style</div>
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  onStyleChange?.(style.id)
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <div>
                  <div className="text-sm font-medium">{style.name}</div>
                  <div className="text-xs text-muted-foreground">{style.description}</div>
                </div>
                {currentStyle === style.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 gap-2 rounded-lg bg-background/95 px-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Layers className="h-4 w-4" />
        <span className="text-sm font-medium">Layers</span>
      </Button>
    </div>
  )
}
