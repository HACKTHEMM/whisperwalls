"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import { validateNoteForModeration } from "@/lib/moderation"

interface PinInfoCardProps {
	coordinates: [number, number] | null;
	onSave: () => void;
	onCancel: () => void;
	onNoteCreated?: (note: {
		id: number;
		created_at: string;
		note: string | null;
		latitude: number;
		longitude: number;
		user_id: string;
	}) => void;
}

export default function PinInfoCard({ coordinates, onSave, onCancel, onNoteCreated }: PinInfoCardProps) {
	const { user } = useAuth()
	const [note, setNote] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)

	if (!coordinates) return null

	const [lng, lat] = coordinates

	const handleSave = async () => {
		if (!user || !coordinates) return

		// Quick client checks first
		const local = validateNoteForModeration(note)
		if (!local.allowed) {
			setErrorMsg(local.reason || "This note is not allowed.")
			return
		}

		setErrorMsg(null)
		setIsSaving(true)
		const { data, error } = await supabase
			.from("notes")
			.insert([
				{
					note,
					latitude: lat,
					longitude: lng,
					user_id: user.id,
				},
			])
			.select("*")
			.single()
		setIsSaving(false)

		if (error) {
			console.error("Error saving note:", error)
			setErrorMsg("Failed to save note. Please try again.")
		} else {
			setNote("")
			if (data && onNoteCreated) {
				onNoteCreated(data as any)
			}
			onSave()
		}
	}

	return (
		<div className="pointer-events-auto fixed left-1/2 bottom-6 z-[1500] -translate-x-1/2 w-[min(400px,92vw)]">
			<Card className="mx-auto flex w-full flex-col gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70">
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="text-sm text-muted-foreground">Dropped pin</div>
					<div className="truncate text-sm">{lat.toFixed(6)}, {lng.toFixed(6)}</div>
					<textarea
						className="mt-2 w-full resize-y rounded-lg border bg-secondary p-2 text-sm outline-none"
						placeholder="Add a note for this place..."
						rows={3}
						value={note}
						onChange={(e) => setNote(e.target.value)}
					/>
					{errorMsg ? (
						<div className="mt-1 text-xs text-red-600">{errorMsg}</div>
					) : null}
				</div>
				<div className="flex shrink-0 items-center gap-2 self-end">
					<Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
					<Button size="sm" onClick={handleSave} disabled={!note.trim() || isSaving}>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</div>
			</Card>
		</div>
	)
}