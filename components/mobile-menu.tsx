"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bookmark, Clock, EllipsisVertical, Home, Menu } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"

export function MobileMenu({ onOpenSaved }: { onOpenSaved?: () => void }) {
  const { user } = useAuth()

  const getInitials = (email: string | undefined) => {
    if (!email) return "U"
    return email[0].toUpperCase()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }
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
          <div className="mb-2 w-full px-4">
            <div className="flex items-center gap-3 rounded-xl border bg-secondary/50 p-3 mt-5">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user?.email ?? "Guest"}</div>
              </div>
              {user && (
                <SheetClose asChild>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </SheetClose>
              )}
            </div>
          </div>
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Home">
            <Home className="h-5 w-5" /> <span className="text-sm font-medium">Home</span>
          </Button>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Saved" onClick={onOpenSaved}>
              <Bookmark className="h-5 w-5" /> <span className="text-sm font-medium">Saved</span>
            </Button>
          </SheetClose>
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Recents">
            <Clock className="h-5 w-5" /> <span className="text-sm font-medium">Recents</span>
          </Button>
          <div className="mt-auto" />
          <Button size="icon" variant="ghost" className="rounded-xl" aria-label="More">
            <EllipsisVertical className="h-5 w-5" /> <span className="text-sm font-medium">More</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
