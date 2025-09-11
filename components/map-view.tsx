"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Crosshair, Minus, Plus, Radar } from "lucide-react"
import LayersMiniCard from "@/components/layersminicard"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Note } from "@/app/page"
import { useAuth } from "@/lib/auth"
import { sanitizeNoteForDisplay } from "@/lib/moderation"

declare global {
  interface Window {
    mapboxgl: any
  }
}

interface PinState {
  coordinates: [number, number]
  marker?: any
}

function ZoomControls({ map, onToggleNearby }: { map: any | null; onToggleNearby: () => void }) {
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
        aria-label="Nearby notes"
        onClick={onToggleNearby}
        className="h-10 w-10 rounded-lg shadow-md"
      >
        <Radar className="h-5 w-5" />
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
  notes: Note[]
  onNoteDelete: (id: number) => void
}

export default function MapView({ onPinChange, onMapReady, mapStyle = "streets-v12", externalPinCoordinates, notes, onNoteDelete }: MapViewProps) {
  const { user } = useAuth()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markerRef = useRef<any | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [currentPin, setCurrentPin] = useState<PinState | null>(null)
  const noteMarkersRef = useRef<any[]>([])

  const [lng] = useState(73.7125)
  const [lat] = useState(24.5854)
  const [zoom] = useState(12)

  // Nearby notes state
  const [nearbyOpen, setNearbyOpen] = useState(false)
  const [nearbyItems, setNearbyItems] = useState<Array<{ key: string; note: string; coords: [number, number]; distanceKm: number }>>([])
  const [nearbyError, setNearbyError] = useState<string | null>(null)

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

    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

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

  useEffect(() => {
    if (!map.current || !window.mapboxgl) return;

    // Clear existing note markers
    noteMarkersRef.current.forEach((marker) => marker.remove());
    noteMarkersRef.current = [];

    // Render new note markers
    notes.forEach((note) => {
        const isOwnNote = note.user_id === user?.id;

        // Build styled popup content
        const popupContent = document.createElement("div");
        popupContent.className = "min-w-[220px] max-w-[280px] p-3";

        const coordsRow = document.createElement("div");
        coordsRow.className = "flex items-center justify-between mb-1";
        const coordsText = document.createElement("div");
        coordsText.className = "text-[11px] text-muted-foreground";
        coordsText.textContent = `${note.latitude.toFixed(6)}, ${note.longitude.toFixed(6)}`;
        coordsRow.appendChild(coordsText);
        popupContent.appendChild(coordsRow);

        const noteText = document.createElement("div");
        noteText.className = "text-sm whitespace-pre-wrap leading-5";
        noteText.textContent = sanitizeNoteForDisplay(note.note || "");
        popupContent.appendChild(noteText);

        // Actions row
        if (isOwnNote) {
          const actions = document.createElement("div");
          actions.className = "mt-3 flex items-center justify-end gap-2";
          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "inline-flex items-center gap-1 rounded-sm bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400";
          deleteButton.innerText = "Delete";
          deleteButton.onclick = async () => {
            // Optimistically disable button to prevent double click
            deleteButton.setAttribute('disabled', 'true');
            try {
              await Promise.resolve(onNoteDelete(note.id));
              // Close popup after deletion request regardless; realtime listener will refresh markers
              if (popup) {
                popup.remove();
              }
            } finally {
              // Re-enable just in case popup didn't close
              deleteButton.removeAttribute('disabled');
            }
          };
          actions.appendChild(deleteButton);
          popupContent.appendChild(actions);
        }

        const marker = new window.mapboxgl.Marker({ color: isOwnNote ? "#22c55e" : "#3b82f6" })
            .setLngLat([note.longitude, note.latitude])
            .addTo(map.current);

        // Reuse a popup instance so we can close it on delete
        let popup: any | null = null;
        marker.getElement().addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            popup = new window.mapboxgl.Popup({ closeOnClick: true, maxWidth: "320px" })
                .setLngLat([note.longitude, note.latitude])
                .setDOMContent(popupContent)
                .addTo(map.current);
        });

        noteMarkersRef.current.push(marker);
    });
  }, [notes, map, user, onNoteDelete]);

  // Haversine distance in km
  function distanceKm(a: [number, number], b: [number, number]): number {
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 6371
    const dLat = toRad(b[1] - a[1])
    const dLng = toRad(b[0] - a[0])
    const lat1 = toRad(a[1])
    const lat2 = toRad(b[1])
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }

  // Draw/remove 1km circle around center
  const CIRCLE_SOURCE_ID = "nearby-circle-source"
  const CIRCLE_FILL_ID = "nearby-circle-fill"
  const CIRCLE_LINE_ID = "nearby-circle-line"

  function generateCircle(center: [number, number], radiusMeters: number, points = 64) {
    const [centerLng, centerLat] = center
    const coords: [number, number][] = []
    const R = 6371000
    for (let i = 0; i <= points; i++) {
      const bearing = (i / points) * 2 * Math.PI
      const lat = Math.asin(
        Math.sin(centerLat * Math.PI / 180) * Math.cos(radiusMeters / R) +
        Math.cos(centerLat * Math.PI / 180) * Math.sin(radiusMeters / R) * Math.cos(bearing)
      )
      const lng = (centerLng * Math.PI / 180) + Math.atan2(
        Math.sin(bearing) * Math.sin(radiusMeters / R) * Math.cos(centerLat * Math.PI / 180),
        Math.cos(radiusMeters / R) - Math.sin(centerLat * Math.PI / 180) * Math.sin(lat)
      )
      coords.push([lng * 180 / Math.PI, lat * 180 / Math.PI])
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [coords] },
        },
      ],
    }
  }

  function addOrUpdateCircle(center: [number, number]) {
    if (!map.current) return
    const data = generateCircle(center, 1000)
    if (map.current.getSource(CIRCLE_SOURCE_ID)) {
      ;(map.current.getSource(CIRCLE_SOURCE_ID) as any).setData(data)
    } else {
      map.current.addSource(CIRCLE_SOURCE_ID, { type: "geojson", data })
      map.current.addLayer({ id: CIRCLE_FILL_ID, type: "fill", source: CIRCLE_SOURCE_ID, paint: { "fill-color": "#3b82f6", "fill-opacity": 0.12 } })
      map.current.addLayer({ id: CIRCLE_LINE_ID, type: "line", source: CIRCLE_SOURCE_ID, paint: { "line-color": "#3b82f6", "line-width": 2, "line-opacity": 0.6 } })
    }
  }

  function removeCircle() {
    if (!map.current) return
    if (map.current.getLayer(CIRCLE_FILL_ID)) map.current.removeLayer(CIRCLE_FILL_ID)
    if (map.current.getLayer(CIRCLE_LINE_ID)) map.current.removeLayer(CIRCLE_LINE_ID)
    if (map.current.getSource(CIRCLE_SOURCE_ID)) map.current.removeSource(CIRCLE_SOURCE_ID)
  }

  function openNearbyAt(center: [number, number]) {
    const items: Array<{ key: string; note: string; coords: [number, number]; distanceKm: number }> = []
    notes.forEach((note) => {
      const d = distanceKm(center, [note.longitude, note.latitude])
      if (d <= 1.0) items.push({ key: note.id.toString(), note: sanitizeNoteForDisplay(note.note || ""), coords: [note.longitude, note.latitude], distanceKm: d })
    })
    items.sort((a, b) => a.distanceKm - b.distanceKm)
    setNearbyItems(items)
    setNearbyError(null)
    setNearbyOpen(true)
    addOrUpdateCircle(center)
  }

  function toggleNearby() {
    if (!map.current) return
    if (nearbyOpen) {
      setNearbyOpen(false)
      setNearbyItems([])
      setNearbyError(null)
      removeCircle()
      return
    }
    const center = currentPin?.coordinates ?? null
    if (!center) {
      setNearbyItems([])
      setNearbyError("No location selected")
      setNearbyOpen(true)
      removeCircle()
      return
    }
    openNearbyAt(center)
    // Fit view slightly
    map.current.flyTo({ center, zoom: Math.max(map.current.getZoom?.() ?? 12, 14) })
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
      noteMarkersRef.current.forEach((marker) => marker.remove())
      noteMarkersRef.current = []
    }
  }, [mapboxLoaded, lng, lat, zoom, mapStyle, onMapReady])

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
      {mapInstance && <ZoomControls map={mapInstance} onToggleNearby={toggleNearby} />}
      <LayersMiniCard
        onStyleChange={(styleId: any) => {
          if (mapInstance) {
            mapInstance.setStyle(`mapbox://styles/mapbox/${styleId}`)
          }
        }}
        currentStyle={mapStyle}
      />

      {/* Nearby Panel - desktop */}
      {nearbyOpen && (
        <div className="pointer-events-auto hidden md:block fixed left-1/2 bottom-20 z-[1500] -translate-x-1/2 w-[min(420px,92vw)]">
          <Card className="mx-auto flex max-h-[50vh] w-full flex-col gap-2 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Nearby notes within 1 km</div>
              <Button size="sm" variant="secondary" onClick={() => { setNearbyOpen(false); setNearbyItems([]); setNearbyError(null); removeCircle(); }}>Close</Button>
            </div>
            {nearbyError ? (
              <div className="text-sm text-muted-foreground">{nearbyError}</div>
            ) : nearbyItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No notes nearby.</div>
            ) : (
              <div className="max-h-[40vh] overflow-y-auto pr-1">
                {nearbyItems.map((item) => (
                  <button key={item.key} className="w-full rounded-xl border p-3 text-left hover:bg-secondary"
                    onClick={() => {
                      if (!map.current) return
                      map.current.flyTo({ center: item.coords, zoom: Math.max(map.current.getZoom?.() ?? 12, 15) })
                      addPin(item.coords)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{item.coords[1].toFixed(6)}, {item.coords[0].toFixed(6)}</div>
                      <div className="text-xs text-muted-foreground">{item.distanceKm.toFixed(2)} km</div>
                    </div>
                    {item.note && <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{item.note}</div>}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Nearby Panel - mobile drawer */}
      <div className="md:hidden">
        <Sheet open={nearbyOpen} onOpenChange={(v) => { if (!v) { setNearbyOpen(false); setNearbyItems([]); setNearbyError(null); removeCircle(); } }}>
          <SheetContent side="bottom" className="h-[60vh]">
            <div className="flex h-full flex-col gap-2">
              <div className="text-sm font-medium">Nearby notes within 1 km</div>
              {nearbyError ? (
                <div className="text-sm text-muted-foreground">{nearbyError}</div>
              ) : nearbyItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No notes nearby.</div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1">
                  {nearbyItems.map((item) => (
                    <button key={item.key} className="w-full rounded-xl border p-3 text-left hover:bg-secondary"
                      onClick={() => {
                        if (!map.current) return
                        map.current.flyTo({ center: item.coords, zoom: Math.max(map.current.getZoom?.() ?? 12, 15) })
                        addPin(item.coords)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{item.coords[1].toFixed(6)}, {item.coords[0].toFixed(6)}</div>
                        <div className="text-xs text-muted-foreground">{item.distanceKm.toFixed(2)} km</div>
                      </div>
                      {item.note && <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{item.note}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
