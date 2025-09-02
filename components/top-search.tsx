"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Clock, X, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { searchService, SearchResult, SearchSuggestion } from "@/lib/search-service"
import { useMapContext } from "@/lib/map-context"

type RecentItem = { label: string; sublabel?: string }

const STORAGE_KEY = "recent-searches"

export function TopSearch() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<RecentItem[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { flyToLocation, droppedPin, clearPin } = useMapContext()

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

  // Update search value when pin is dropped
  useEffect(() => {
    if (droppedPin) {
      setValue(`${droppedPin.lat.toFixed(6)}, ${droppedPin.lng.toFixed(6)}`)
    }
  }, [droppedPin])

  // Handle search input changes with suggestions
  useEffect(() => {
    if (value.trim()) {
      setIsSearching(true)
      searchService.getSuggestions(value).then((results) => {
        setSuggestions(results)
        setIsSearching(false)
      })
    } else {
      setSuggestions([])
      setIsSearching(false)
    }
  }, [value])

  async function submitSearch() {
    if (!value.trim()) return
    
    setIsSearching(true)
    const results = await searchService.searchLocations(value)
    setSearchResults(results)
    setIsSearching(false)
    
    if (results.length > 0) {
      const firstResult = results[0]
      flyToLocation(firstResult.lat, firstResult.lon)
      addRecent(`${firstResult.name}, ${firstResult.display_name.split(',').slice(-2).join(',')}`)
    } else {
      addRecent(value)
    }
    
    setOpen(false)
  }

  function handleLocationSelect(result: SearchResult) {
    flyToLocation(result.lat, result.lon)
    addRecent(`${result.name}, ${result.display_name.split(',').slice(-2).join(',')}`)
    setValue(result.name)
    setOpen(false)
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
      {/* relative container so dropdown can be positioned under the search bar, right-aligned on md+ */}
      <div ref={wrapperRef} className="relative md:w-[min(640px,92vw)]">
        <div className="flex w-full items-center gap-2 rounded-full bg-background/95 p-1 pl-2 pr-1 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="md:hidden">
            <Button size="icon" variant="ghost" aria-label="Open menu" className="rounded-full">
              <MobileMenu />
            </Button>
          </div>
          <Input
            placeholder="Search Maps"
            aria-label="Search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submitSearch()
              } else if (e.key === "Escape") {
                setOpen(false)
              }
            }}
            className="h-11 flex-1 rounded-full border-0 bg-secondary px-4 text-base"
          />
          <Button 
            size="icon" 
            className="h-11 w-11 rounded-full" 
            aria-label={droppedPin ? "Clear pin" : "Search"} 
            onClick={droppedPin ? clearPin : submitSearch}
          >
            {droppedPin ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>

        {open && (
          <div
            className={cn(
              "absolute z-[1100] mt-2 w-full",
              // On md+, keep the dropdown the same width as the input (already constrained by parent)
              "md:w-[min(640px,92vw)]",
            )}
          >
            <Card
              className="rounded-2xl border bg-background/95 p-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70"
              onMouseDown={(e) => {
                // prevent input blur collapse when clicking inside dropdown
                e.preventDefault()
              }}
              role="listbox"
              aria-label="Search results"
            >
              {isSearching ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</div>
              ) : value.trim() ? (
                // Show search suggestions when typing
                <div className="max-h-[50vh] overflow-auto">
                  {suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                          <button
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
                            onClick={() => {
                              setValue(suggestion.name)
                              setOpen(false)
                            }}
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{suggestion.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{suggestion.display_name}</div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No suggestions found.</div>
                  )}
                </div>
              ) : (
                // Show recent searches when not typing
                <div className="max-h-[50vh] overflow-auto">
                  {recents.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No recent searches yet.</div>
                  ) : (
                    <ul>
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
                </div>
              )}

              <div className="mt-1 flex items-center justify-between px-2">
                <button
                  className="rounded-md px-2 py-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  onClick={() => {
                    // Placeholder for full history view
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
