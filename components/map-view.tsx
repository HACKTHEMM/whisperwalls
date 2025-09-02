"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from "react-leaflet"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Crosshair, Layers, Minus, Plus, Check } from "lucide-react"
import L from "leaflet"
import { useMapContext } from "@/lib/map-context"

// Available map layers
const MAP_LAYERS = [
  {
    id: "streets",
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    available: true,
    thumbnail: "/streetview.jpg?height=56&width=80&query=streets"
  },
  {
    id: "satellite",
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    available: true,
    thumbnail: "/satelliteview.jpeg?height=56&width=80&query=satellite"
  },
  {
    id: "terrain",
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
    available: true,
    thumbnail: "/terrainview.png?height=56&width=80&query=terrain"
  },
  {
    id: "dark",
    name: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    available: true,
    thumbnail: "/darkview.jpeg?height=56&width=80&query=dark"
  }
  // {
  //   id: "urban",
  //   name: "Urban",
  //   url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  //   available: false, // This layer is not available
  //   thumbnail: "/placeholder.svg?height=56&width=80&query=urban"
  // }
]

function ZoomControls({ isLocationActive, onLocationToggle }: { isLocationActive: boolean; onLocationToggle: (active: boolean) => void }) {
  const map = useMap()
  
  const handleLocationClick = () => {
    if (isLocationActive) {
      // Turn off location tracking
      onLocationToggle(false)
      map.stopLocate()
    } else {
      // Turn on location tracking
      onLocationToggle(true)
      map.locate({ setView: true, maxZoom: 16 })
    }
  }

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
        variant={isLocationActive ? "default" : "secondary"}
        aria-label="Locate me"
        onClick={handleLocationClick}
        className={`h-10 w-10 rounded-lg shadow-md ${isLocationActive ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
      >
        <Crosshair className={`h-5 w-5 ${isLocationActive ? 'text-white' : ''}`} />
      </Button>
    </div>
  )
}

function LayerChanger({ currentLayer, onLayerChange }: { currentLayer: string; onLayerChange: (layerId: string) => void }) {
  const map = useMap()
  
  const changeLayer = (layerId: string) => {
    const layer = MAP_LAYERS.find(l => l.id === layerId)
    if (layer && layer.available) {
      onLayerChange(layerId)
      // Force map to refresh tiles
      map.invalidateSize()
    }
  }

  return null
}

function LayersMiniCard({ currentLayer, onLayerChange }: { currentLayer: string; onLayerChange: (layerId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLayerData = MAP_LAYERS.find(l => l.id === currentLayer)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (isOpen && !target.closest('.layers-menu')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="absolute left-4 bottom-4 z-[1000] md:left-24">
      <div className="relative layers-menu">
        <div className="flex items-center gap-2 rounded-xl bg-background/90 p-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="h-14 w-20 overflow-hidden rounded-lg bg-muted">
            <img
              src={currentLayerData?.thumbnail || "/placeholder.svg?height=56&width=80&query=map%20thumbnail"}
              alt="Layer preview"
              className="h-full w-full object-cover"
            />
          </div>
          <Button 
            variant="secondary" 
            className="gap-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Layers className="h-4 w-4" />
            Layers
          </Button>
        </div>

        {isOpen && (
          <div 
            className="layers-menu absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/70"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-sm font-medium text-foreground">Map Layers</div>
            <div className="space-y-2">
              {MAP_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (layer.available) {
                      onLayerChange(layer.id)
                      setIsOpen(false)
                    }
                  }}
                  disabled={!layer.available}
                  className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors ${
                    layer.available 
                      ? 'hover:bg-muted' 
                      : 'opacity-50 cursor-not-allowed'
                  } ${currentLayer === layer.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded bg-muted">
                      <img
                        src={layer.thumbnail}
                        alt={layer.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm">{layer.name}</span>
                  </div>
                  {currentLayer === layer.id && layer.available && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LocationMarker({ isLocationActive, userLocation }: { isLocationActive: boolean; userLocation: [number, number] | null }) {
  if (!isLocationActive || !userLocation) return null

  // Create a custom blue circle icon
  const blueCircleIcon = L.divIcon({
    className: 'custom-location-marker',
    html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  return (
    <Marker 
      position={userLocation} 
      icon={blueCircleIcon}
    />
  )
}

function MapContextSetter() {
  const map = useMap()
  const { setMap } = useMapContext()

  useEffect(() => {
    setMap(map)
    return () => setMap(null)
  }, [map, setMap])

  return null
}

function Geolocate({ onLocationFound }: { onLocationFound: (latlng: [number, number]) => void }) {
  const map = useMap()
  useMapEvents({
    locationfound(e: any) {
      onLocationFound([e.latlng.lat, e.latlng.lng])
      map.flyTo(e.latlng, Math.max(map.getZoom(), 15), { duration: 0.75 })
    },
    locationerror() {
      // Handle location error
      console.log('Location access denied or error occurred')
    }
  })
  return null
}

export default function MapView() {
  // Center near Udaipur as in the reference screenshot
  const [center] = useState<[number, number]>([24.5854, 73.7125])
  const [currentLayer, setCurrentLayer] = useState("streets")
  const [isLocationActive, setIsLocationActive] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const currentLayerData = MAP_LAYERS.find(l => l.id === currentLayer)

  const handleLocationFound = (latlng: [number, number]) => {
    setUserLocation(latlng)
  }

  const handleLocationToggle = (active: boolean) => {
    setIsLocationActive(active)
    if (!active) {
      setUserLocation(null)
    }
  }

  return (
    <div className="h-full w-full">
       <MapContainer center={center} zoom={12} className="h-full w-full" zoomControl={false} attributionControl={false}>
        <TileLayer
          url={currentLayerData?.url || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
           attribution={currentLayerData?.attribution || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
        />
        <MapContextSetter />
        <Geolocate onLocationFound={handleLocationFound} />
        <LocationMarker isLocationActive={isLocationActive} userLocation={userLocation} />
        <ZoomControls isLocationActive={isLocationActive} onLocationToggle={handleLocationToggle} />
        <LayerChanger currentLayer={currentLayer} onLayerChange={setCurrentLayer} />
        <LayersMiniCard currentLayer={currentLayer} onLayerChange={setCurrentLayer} />
      </MapContainer>
    </div>
  )
}
