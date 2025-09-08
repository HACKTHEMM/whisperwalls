"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/lib/auth"

interface Note {
  id: number
  created_at: string
  note: string | null
  latitude: number
  longitude: number
  user_id: string
}

interface SavedNotesPanelProps {
  open: boolean
  onClose: () => void
  onSelect: (coords: [number, number]) => void
}

export default function SavedNotesPanel({ open, onClose, onSelect }: SavedNotesPanelProps) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    if (!user || !open) return

    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching notes:", error)
      } else {
        setNotes(data)
      }
    }

    fetchNotes()

    const channel = supabase
      .channel("notes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        (payload) => {
          fetchNotes() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, open])

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("notes").delete().eq("id", id)
    if (error) {
      console.error("Error deleting note:", error)
    } else {
      setNotes(notes.filter((n) => n.id !== id))
    }
  }

  return (
    <div className={`pointer-events-none fixed left-1/2 top-4 z-[1200] h-[calc(100vh-2rem)] w-[min(360px,92vw)] -translate-x-1/2 transition-transform duration-200 md:left-24 ${open ? "block md:translate-x-0" : "hidden md:block md:-translate-x-[120%]"}`}>
      <div className="pointer-events-auto h-full pr-4">
        <Card className="h-full w-full rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Saved notes</div>
            <Button size="icon" variant="ghost" className="rounded-lg" aria-label="Close saved notes" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="h-[1px] w-full bg-border" />
          <div className="mt-2 flex h-[calc(100%-56px)] flex-col gap-2 overflow-y-auto pr-1">
            {notes.length === 0 && (
              <div className="text-sm text-muted-foreground">No notes yet. Add a note to a pin to see it here.</div>
            )}
            {notes.map((note) => (
              <div key={note.id} className="group w-full rounded-xl border p-3 text-left transition-colors hover:bg-secondary">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => onSelect([note.longitude, note.latitude])} className="flex-grow text-left">
                    <div className="truncate text-sm font-medium">{note.latitude.toFixed(6)}, {note.longitude.toFixed(6)}</div>
                    {note.note && (
                      <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{note.note}</div>
                    )}
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-lg h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete note"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
