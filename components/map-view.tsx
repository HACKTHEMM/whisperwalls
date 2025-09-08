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
  externalPinCoordinates?: [number, number] | null
}

export default function MapView({ onPinChange, onMapReady, mapStyle = "streets-v12", externalPinCoordinates }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markerRef = useRef<any | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [currentPin, setCurrentPin] = useState<PinState | null>(null)
  const savedMarkersRef = useRef<any[]>([])

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
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    setCurrentPin(null)
    onPinChange?.(null)
  }

  const addPin = (coordinates: [number, number]) => {
    if (!map.current || !window.mapboxgl) return

    // Remove existing pin via ref to avoid stale closures
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    // Create new marker
    const marker = new window.mapboxgl.Marker({
      color: "#ef4444", // red color
      draggable: false,
    })
      .setLngLat(coordinates)
      .addTo(map.current)

    markerRef.current = marker
    const newPin = { coordinates, marker }
    setCurrentPin(newPin)
    onPinChange?.(newPin)
  }

  // Utilities to load saved notes and render markers
  const loadSavedNotes = (): Record<string, string> => {
    try {
      const raw = localStorage.getItem("pin-notes-v1")
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const parseKeyToCoords = (key: string): [number, number] | null => {
    const parts = key.split(",")
    if (parts.length !== 2) return null
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return [lng, lat]
  }

  const clearSavedMarkers = () => {
    savedMarkersRef.current.forEach((m) => m.remove())
    savedMarkersRef.current = []
  }

  const renderSavedMarkers = () => {
    if (!map.current || !window.mapboxgl) return
    clearSavedMarkers()
    const notes = loadSavedNotes()
    Object.keys(notes).forEach((key) => {
      const coords = parseKeyToCoords(key)
      if (!coords) return
      const marker = new window.mapboxgl.Marker({ color: "#22c55e" /* green */ })
        .setLngLat(coords)
        .addTo(map.current)
      savedMarkersRef.current.push(marker)
    })
  }
  

  // Sync with parent-provided coordinates (clear or set)
  useEffect(() => {
    if (externalPinCoordinates == null) {
      if (currentPin) removePin()
      return
    }
    const [lng, lat] = externalPinCoordinates
    if (!currentPin || currentPin.coordinates[0] !== lng || currentPin.coordinates[1] !== lat) {
      addPin([lng, lat])
    }
  }, [externalPinCoordinates])

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

      // Render saved markers initially and when notes change
      renderSavedMarkers()
      const onNotesUpdated = () => renderSavedMarkers()
      window.addEventListener("pin-notes-updated", onNotesUpdated)

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
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      clearSavedMarkers()
      window.removeEventListener("pin-notes-updated", renderSavedMarkers as any)
    }
  }, [mapboxLoaded, lng, lat, zoom, mapStyle, onMapReady])

  // (removed faulty effect that invoked onPinChange)

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
