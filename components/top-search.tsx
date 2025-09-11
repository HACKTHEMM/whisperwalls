"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Menu, Search, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
type RecentItem = { label: string; sublabel?: string }

const STORAGE_KEY = "recent-searches"

interface TopSearchProps {
  pinCoordinates?: [number, number] | null
  onClearPin?: () => void
  onOpenSaved?: () => void
}

export function TopSearch({ pinCoordinates, onClearPin, onOpenSaved }: TopSearchProps) {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<RecentItem[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pinCoordinates) {
      const [lng, lat] = pinCoordinates
      setValue(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      setOpen(false)
    }
  }, [pinCoordinates])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecents(JSON.parse(raw).slice(0, 4))
    } catch {}
  }, [])

  function persist(next: RecentItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 8)))
    } catch {}
  }

  function addRecent(label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    const next = [{ label: trimmed }, ...recents.filter((r) => r.label.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      4,
    )
    setRecents(next)
    persist(next)
  }

  function submitSearch() {
    if (pinCoordinates && onClearPin) {
      // If showing coordinates, clear the pin
      onClearPin()
      setValue("")
    } else {
      // Normal search
      addRecent(value)
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div className="pointer-events-auto">
      <div ref={wrapperRef} className="relative w-full md:w-[min(640px,92vw)]">
        <div className="flex w-full items-center gap-2 rounded-full bg-background/95 p-1 pl-2 pr-1 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <MobileMenu onOpenSaved={onOpenSaved} />
          <Input
            placeholder={pinCoordinates ? "Coordinates" : "Search Maps"}
            aria-label="Search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => !pinCoordinates && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submitSearch()
              } else if (e.key === "Escape") {
                if (pinCoordinates && onClearPin) {
                  onClearPin()
                  setValue("")
                } else {
                  setOpen(false)
                }
              }
            }}
            className="h-11 flex-1 rounded-full border-0 bg-secondary px-4 text-base"
            readOnly={!!pinCoordinates}
          />
          <Button
            size="icon"
            className="h-11 w-11 rounded-full"
            aria-label={pinCoordinates ? "Clear pin" : "Search"}
            onClick={submitSearch}
          >
            {pinCoordinates ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>

        {open && !pinCoordinates && (
          <div className={cn("absolute z-[1100] mt-2 w-full", "md:w-[min(640px,92vw)]")}>
            <Card
              className="rounded-2xl border bg-background/95 p-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70"
              onMouseDown={(e) => {
                e.preventDefault()
              }}
              role="listbox"
              aria-label="Recent searches"
            >
              {recents.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No recent searches yet.</div>
              ) : (
                <ul className="max-h-[50vh] overflow-auto">
                  {recents.slice(0, 4).map((r, i) => (
                    <li key={i}>
                      <button
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setValue(r.label)
                          setOpen(false)
                        }}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{r.label}</div>
                          {r.sublabel && <div className="truncate text-xs text-muted-foreground">{r.sublabel}</div>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-1 flex items-center justify-between px-2">
                <button
                  className="rounded-md px-2 py-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    setOpen(false)
                  }}
                >
                  More from recent history
                </button>
                {recents.length > 0 && (
                  <button
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setRecents([])
                      persist([])
                    }}
                    aria-label="Clear recents"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
