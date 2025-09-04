"use client"

import dynamic from "next/dynamic"
import { Suspense, useState } from "react"
import { LeftRail } from "@/components/left-rail"
import { TopSearch } from "@/components/top-search"
import { SuggestedChips } from "@/components/suggested-chips"
import { AccountAvatar } from "@/components/account-avatar"

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

interface PinState {
  coordinates: [number, number]
  marker?: any
}

export default function Page() {
  const [currentPin, setCurrentPin] = useState<PinState | null>(null)
  const [mapStyle, setMapStyle] = useState("streets-v12")
  const [mapInstance, setMapInstance] = useState<any>(null)

  const handleClearPin = () => {
    setCurrentPin(null)
    // The MapView component will handle marker removal via onPinChange
  }

  const handleStyleChange = (styleId: string) => {
    setMapStyle(styleId)
    if (mapInstance) {
      mapInstance.setStyle(`mapbox://styles/mapbox/${styleId}`)
    }
  }

  return (
    <main className="fixed inset-0 bg-background">
      {/* Map canvas */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full bg-muted" />}>
          <MapView onPinChange={setCurrentPin} onMapReady={setMapInstance} mapStyle={mapStyle} />
        </Suspense>
      </div>

      {/* Left rail (hidden on small screens) */}
      <LeftRail />

      <div className="pointer-events-none fixed top-4 left-4 right-4 z-[1000] flex max-w-full flex-col gap-3 md:left-24 md:right-auto md:items-start">
        <TopSearch pinCoordinates={currentPin?.coordinates} onClearPin={handleClearPin} />
        <SuggestedChips />
      </div>

      {/* Top-right account avatar */}
      <div className="fixed right-4 top-4 z-[1000]">
        <AccountAvatar />
      </div>
    </main>
  )
}
