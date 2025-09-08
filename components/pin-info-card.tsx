"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "pin-notes-v1"

function coordsKey(coords: [number, number]) {
  const [lng, lat] = coords
  return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {}
}

interface PinInfoCardProps {
  coordinates: [number, number] | null
}

export default function PinInfoCard({ coordinates }: PinInfoCardProps) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const key = useMemo(() => (coordinates ? coordsKey(coordinates) : null), [coordinates])
  const note = key ? notes[key] : undefined

  useEffect(() => {
    setNotes(loadNotes())
  }, [])

  useEffect(() => {
    if (!coordinates) {
      setEditing(false)
      setDraft("")
    } else if (key) {
      setDraft(notes[key] ?? "")
    }
  }, [coordinates, key, notes])

  if (!coordinates) return null

  const [lng, lat] = coordinates

  function startEditing() {
    setDraft(note ?? "")
    setEditing(true)
  }

  function save() {
    if (!key) return
    const next = { ...notes, [key]: draft.trim() }
    setNotes(next)
    saveNotes(next)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
    setDraft(note ?? "")
  }

  return (
    <div className="pointer-events-auto fixed left-1/2 bottom-6 z-[1500] -translate-x-1/2 w-[min(400px,92vw)]">
      <Card className="mx-auto flex w-full items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-sm text-muted-foreground">Dropped pin</div>
          <div className="truncate text-sm">{lat.toFixed(6)}, {lng.toFixed(6)}</div>
          {!editing && note && (
            <div className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm">{note}</div>
          )}
          {editing && (
            <textarea
              className="mt-2 w-full resize-y rounded-lg border bg-secondary p-2 text-sm outline-none"
              placeholder="Add a note for this place..."
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
        </div>
        {!editing ? (
          note ? (
            <Button size="sm" variant="secondary" onClick={startEditing} className="shrink-0">Edit note</Button>
          ) : (
            <Button size="sm" onClick={startEditing} className="shrink-0">Add note</Button>
          )
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="secondary" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        )}
      </Card>
    </div>
  )
}


