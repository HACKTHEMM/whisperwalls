"use client"

import { Button } from "@/components/ui/button"
import { Bookmark, Clock, Home, Satellite, Mountain } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface LeftRailProps {
  onOpenSaved?: () => void;
  onStyleChange: (styleId: string) => void;
}

export function LeftRail({ onOpenSaved, onStyleChange }: LeftRailProps) {
  return (
    <aside className="pointer-events-none fixed left-0 top-0 z-[1000] hidden h-full w-[72px] pl-2 pr-2 pt-3 pb-3 md:block">
      <div className="pointer-events-auto flex h-full w-full flex-col items-center gap-2 rounded-2xl bg-background/90 py-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Streets View" onClick={() => onStyleChange('streets-v12')}>
          <Home className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Saved" onClick={onOpenSaved}>
          <Bookmark className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Recents">
          <Clock className="h-5 w-5" />
        </Button>
        <div className="mt-auto" />
        <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Account">
          <Avatar className="h-8 w-8">
            <AvatarFallback>V</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </aside>
  )
}
