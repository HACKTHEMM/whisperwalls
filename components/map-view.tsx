"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Crosshair, Minus, Plus } from "lucide-react"
import LayersMiniCard from "@/components/layersminicard"

declare global {
  interface Window {
    mapboxgl: any
  }
}

interface PinState {
  coordinates: [number, number]
  marker?: any
}

function ZoomControls({ map }: { map: any | null }) {
  return (
    <div className="absolute right-4 bottom-28 z-[500] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        aria-label="Zoom in"
        onClick={() => map?.zoomIn()}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        aria-label="Zoom out"
        onClick={() => map?.zoomOut()}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Minus className="h-5 w-5" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        aria-label="Locate me"
        onClick={() => {
          if (navigator.geolocation && map) {
            navigator.geolocation.getCurrentPosition((position) => {
              map.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: Math.max(map.getZoom(), 15),
              })
            })
          }
        }}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Crosshair className="h-5 w-5" />
      </Button>
    </div>
  )
}

interface MapViewProps {
  onPinChange?: (pin: PinState | null) => void
  onMapReady?: (map: any) => void
  mapStyle?: string
}

export default function MapView({ onPinChange, onMapReady, mapStyle = "streets-v12" }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [currentPin, setCurrentPin] = useState<PinState | null>(null)

  const [lng] = useState(73.7125)
  const [lat] = useState(24.5854)
  const [zoom] = useState(12)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && currentPin) {
        removePin()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentPin])

  const removePin = () => {
    if (currentPin?.marker) {
      currentPin.marker.remove()
    }
    setCurrentPin(null)
    onPinChange?.(null)
  }

  const addPin = (coordinates: [number, number]) => {
    if (!map.current || !window.mapboxgl) return

    // Remove existing pin
    if (currentPin?.marker) {
      currentPin.marker.remove()
    }

    // Create new marker
    const marker = new window.mapboxgl.Marker({
      color: "#ef4444", // red color
      draggable: false,
    })
      .setLngLat(coordinates)
      .addTo(map.current)

    const newPin = { coordinates, marker }
    setCurrentPin(newPin)
    onPinChange?.(newPin)
  }

  useEffect(() => {
    const loadMapbox = async () => {
      if (window.mapboxgl) {
        setMapboxLoaded(true)
        return
      }

      // Load CSS
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
      document.head.appendChild(cssLink)

      // Load JS
      const script = document.createElement("script")
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"
      script.onload = () => {
        setMapboxLoaded(true)
      }
      document.head.appendChild(script)
    }

    loadMapbox()
  }, [])

  useEffect(() => {
    if (!mapboxLoaded || map.current || !mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!token) {
      setTokenError(
        "Mapbox access token is missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables.",
      )
      return
    }

    window.mapboxgl.accessToken = token

    try {
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
      })

      map.current.on("click", (e: any) => {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        addPin(coordinates)
      })

      setMapInstance(map.current)
      onMapReady?.(map.current)
    } catch (error) {
      console.error("[v0] Mapbox initialization error:", error)
      setTokenError("Failed to initialize Mapbox. Please check your access token.")
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapboxLoaded, lng, lat, zoom, mapStyle, onMapReady])

  useEffect(() => {
    if (!onPinChange) return

    // If parent cleared the pin, remove the marker
    const handlePinClear = () => {
      if (currentPin?.marker) {
        currentPin.marker.remove()
        setCurrentPin(null)
      }
    }

    // Listen for external pin clearing
    if (!currentPin && onPinChange(null)) {
      handlePinClear()
    }
  }, [currentPin, onPinChange])

  if (tokenError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center p-8 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Mapbox Configuration Required</h3>
          <p className="text-muted-foreground mb-4">{tokenError}</p>
          <p className="text-sm text-muted-foreground">
            Add your Mapbox access token in Project Settings → Environment Variables
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      {mapInstance && <ZoomControls map={mapInstance} />}
      <LayersMiniCard
        onStyleChange={(styleId: any) => {
          if (mapInstance) {
            mapInstance.setStyle(`mapbox://styles/mapbox/${styleId}`)
          }
        }}
        currentStyle={mapStyle}
      />
    </div>
  )
}
