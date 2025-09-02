"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crosshair, Layers, Minus, Plus } from "lucide-react"

function ZoomControls() {
  const map = useMap()
  return (
    <div className="absolute right-4 bottom-28 z-[500] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        aria-label="Zoom in"
        onClick={() => map.zoomIn()}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        aria-label="Zoom out"
        onClick={() => map.zoomOut()}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Minus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        aria-label="Locate me"
        onClick={() => map.locate({ setView: true, maxZoom: 16 })}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Crosshair className="h-5 w-5" />
      </Button>
    </div>
  )
}

function LayersMiniCard() {
  return (
    <div className="absolute left-4 bottom-4 z-[1000] md:left-24">
      <div className="flex items-center gap-2 rounded-xl bg-background/90 p-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="h-14 w-20 overflow-hidden rounded-lg bg-muted">
          <img
            src={"/placeholder.svg?height=56&width=80&query=map%20thumbnail"}
            alt="Layer preview"
            className="h-full w-full object-cover"
          />
        </div>
        <Button variant="secondary" className="gap-2">
          <Layers className="h-4 w-4" />
          Layers
        </Button>
      </div>
    </div>
  )
}

function Geolocate() {
  const map = useMap()
  useMapEvents({
    locationfound(e: any) {
      map.flyTo(e.latlng, Math.max(map.getZoom(), 15), { duration: 0.75 })
    },
  })
  return null
}

export default function MapView() {
  // Center near Udaipur as in the reference screenshot
  const [center] = useState<[number, number]>([24.5854, 73.7125])

  return (
    <div className="h-full w-full">
      {/* @ts-expect-error: react-leaflet type mismatch */}
      <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false} attributionControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // @ts-expect-error: 'attribution' prop is not in type but is supported by Leaflet
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Geolocate />
        <ZoomControls />
        <LayersMiniCard />
      </MapContainer>
    </div>
  )
}
