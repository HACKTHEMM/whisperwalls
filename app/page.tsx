"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LeftRail } from "@/components/left-rail"
import { TopSearch } from "@/components/top-search"
import { SuggestedChips } from "@/components/suggested-chips"
import { AccountAvatar } from "@/components/account-avatar"
import { MobileMenu } from "@/components/mobile-menu"

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

export default function Page() {
  return (
    <main className="fixed inset-0 bg-background">
      {/* Map canvas */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full bg-muted" />}>
          <MapView />
        </Suspense>
      </div>

      {/* Left rail (hidden on small screens) */}
      <LeftRail />

      {/* Top-left search and suggested chips */}
      <div className="pointer-events-none fixed top-4 left-4 right-4 z-[1000] flex max-w-full flex-col gap-3 md:left-[88px] md:right-28">
        <TopSearch />
        <SuggestedChips />
        <div className="pointer-events-auto flex justify-between items-center">
        </div>
      </div>
    </main>
  )
}
