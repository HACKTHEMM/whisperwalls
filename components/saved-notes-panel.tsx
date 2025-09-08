"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const STORAGE_KEY = "pin-notes-v1"

function parseKeyToCoords(key: string): [number, number] | null {
	const parts = key.split(",")
	if (parts.length !== 2) return null
	const lat = parseFloat(parts[0])
	const lng = parseFloat(parts[1])
	if (Number.isNaN(lat) || Number.isNaN(lng)) return null
	return [lng, lat]
}

function loadNotes(): Record<string, string> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? JSON.parse(raw) : {}
	} catch {
		return {}
	}
}

interface SavedNotesPanelProps {
	open: boolean
	onClose: () => void
	onSelect: (coords: [number, number]) => void
}

export default function SavedNotesPanel({ open, onClose, onSelect }: SavedNotesPanelProps) {
	const [notes, setNotes] = useState<Record<string, string>>({})

	useEffect(() => {
		setNotes(loadNotes())
		const handler = () => setNotes(loadNotes())
		if (typeof window !== "undefined") {
			window.addEventListener("pin-notes-updated", handler)
		}
		return () => {
			if (typeof window !== "undefined") {
				window.removeEventListener("pin-notes-updated", handler)
			}
		}
	}, [])

	const entries = useMemo(() => Object.entries(notes), [notes])

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
						{entries.length === 0 && (
							<div className="text-sm text-muted-foreground">No notes yet. Add a note to a pin to see it here.</div>
						)}
						{entries.map(([key, note]) => {
							const coords = parseKeyToCoords(key)
							if (!coords) return null
							const [lng, lat] = coords
							return (
								<button
									key={key}
									onClick={() => onSelect(coords)}
									className="group w-full rounded-xl border p-3 text-left transition-colors hover:bg-secondary"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="truncate text-sm font-medium">{lat.toFixed(6)}, {lng.toFixed(6)}</div>
										<div className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">Show</div>
									</div>
									{note && (
										<div className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{note}</div>
									)}
								</button>
							)
						})}
					</div>
				</Card>
			</div>
		</div>
	)
}
