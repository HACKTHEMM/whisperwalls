"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Bookmark, Clock, EllipsisVertical, Home, Menu } from "lucide-react"

export function MobileMenu({ onOpenSaved }: { onOpenSaved?: () => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          variant="secondary" 
          className="md:hidden h-10 w-10 rounded-lg shadow-md"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full w-full flex-col items-center gap-2 rounded-2xl bg-background/90 py-6 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Home">
            <Home className="h-5 w-5" />
          </Button>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Saved" onClick={onOpenSaved}>
              <Bookmark className="h-5 w-5" />
            </Button>
          </SheetClose>
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Recents">
            <Clock className="h-5 w-5" />
          </Button>
          <div className="mt-auto" />
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="More">
            <EllipsisVertical className="h-5 w-5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
