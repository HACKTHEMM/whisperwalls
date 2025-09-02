"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function AccountAvatar() {
  return (
    <Button
      variant="secondary"
      className="pointer-events-auto flex items-center gap-2 rounded-full pl-2 pr-3 shadow-md"
      aria-label="Account"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>V</AvatarFallback>
      </Avatar>
      <span className="hidden text-sm font-medium md:inline">Account</span>
    </Button>
  )
}
