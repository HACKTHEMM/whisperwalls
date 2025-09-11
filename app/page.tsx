"use client"

import dynamic from "next/dynamic"
import { Suspense, useState, useEffect } from "react"
import { LeftRail } from "@/components/left-rail"
import { TopSearch } from "@/components/top-search"
import { SuggestedChips } from "@/components/suggested-chips"
import { AccountAvatar } from "@/components/account-avatar"
import PinInfoCard from "@/components/pin-info-card"
import SavedNotesPanel from "@/components/saved-notes-panel"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import type { Map, Marker } from "mapbox-gl"

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

interface PinState {
  coordinates: [number, number]
  marker?: Marker | null
}

export interface Note {
  id: number;
  created_at: string;
  note: string | null;
  latitude: number;
  longitude: number;
  user_id: string;
}

export default function Page() {
  const { session, user } = useAuth()
  const [currentPin, setCurrentPin] = useState<PinState | null>(null)
  const [mapStyle, setMapStyle] = useState("streets-v12")
  const [mapInstance, setMapInstance] = useState<Map | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotes(data);
      }
    };

    fetchNotes();

    const channel = supabase
      .channel("notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const handleDeleteNote = async (id: number): Promise<boolean> => {
    // Optimistic removal
    setNotes((prev) => prev.filter((n) => n.id !== id))
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting note:", error);
      // Fallback: refetch to restore correct state
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false })
      if (data) setNotes(data)
      return false;
    }
    return true;
  };

  if (!session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            socialLayout="horizontal"
          />
        </div>
      </div>
    )
  }

  return (
    <main className="fixed inset-0 bg-background">
      {/* Map canvas */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full bg-muted" />}>
          <MapView
            onPinChange={setCurrentPin}
            onMapReady={setMapInstance}
            mapStyle={mapStyle}
            externalPinCoordinates={currentPin?.coordinates ?? null}
            notes={notes}
            onNoteDelete={handleDeleteNote}
          />
        </Suspense>
      </div>

      {/* Left rail (hidden on small screens) */}
      <LeftRail onOpenSaved={() => setSavedOpen((v) => !v)} onStyleChange={handleStyleChange} />

      {/* Saved notes sliding panel */}
      <SavedNotesPanel
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        onSelect={(coords) => {
          // Center the map and set the external pin
          if (mapInstance) {
            mapInstance.flyTo({ center: coords, zoom: Math.max(mapInstance.getZoom?.() ?? 12, 14) })
          }
          setCurrentPin({ coordinates: coords })
          setSavedOpen(false)
        }}
      />

      <div className="pointer-events-none fixed top-4 left-4 right-4 z-[1000] flex max-w-full flex-col gap-3 md:left-24 md:right-auto md:items-start">
        <TopSearch pinCoordinates={currentPin?.coordinates} onClearPin={handleClearPin} onOpenSaved={() => setSavedOpen(true)} />
        <SuggestedChips />
      </div>

      {/* Bottom-center pin info card */}
      <PinInfoCard
        coordinates={currentPin?.coordinates ?? null}
        onSave={handleClearPin}
        onCancel={handleClearPin}
        onNoteCreated={(created) => {
          setNotes((prev) => [created, ...prev])
        }}
      />

      {/* Top-right account avatar */}
      <div className="fixed right-4 top-4 z-[1000]">
        <AccountAvatar />
      </div>
    </main>
  )
}
