"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"

export function AccountAvatar() {
  const { user } = useAuth()
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const getInitials = (email: string | undefined) => {
    if (!email) return "U"
    return email[0].toUpperCase()
  }

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsMenuVisible(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsMenuVisible(false)
    }, 300) // 300ms delay
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="secondary"
        className="pointer-events-auto flex items-center gap-2 rounded-full pl-2 pr-3 shadow-md"
        aria-label="Account"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata.avatar_url} />
          <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium md:inline">Account</span>
      </Button>
      {isMenuVisible && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-lg p-2 z-10">
          <div className="text-sm text-gray-500 p-2">{user?.email}</div>
          <Button onClick={handleSignOut} className="w-full text-left">Sign Out</Button>
        </div>
      )}
    </div>
  )
}
