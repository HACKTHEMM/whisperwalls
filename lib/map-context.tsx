"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Map } from 'leaflet'

interface MapContextType {
  map: Map | null
  setMap: (map: Map | null) => void
  flyToLocation: (lat: number, lng: number, zoom?: number) => void
  droppedPin: { id: string; lat: number; lng: number; label?: string } | null
  setDroppedPin: (pin: { id: string; lat: number; lng: number; label?: string } | null) => void
  clearPin: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map | null>(null)
  const [droppedPin, setDroppedPin] = useState<{ id: string; lat: number; lng: number; label?: string } | null>(null)

  const flyToLocation = (lat: number, lng: number, zoom: number = 15) => {
    if (map) {
      map.flyTo([lat, lng], zoom, { duration: 1 })
    }
  }

  const clearPin = () => {
    setDroppedPin(null)
  }

  return (
    <MapContext.Provider value={{ map, setMap, flyToLocation, droppedPin, setDroppedPin, clearPin }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}
