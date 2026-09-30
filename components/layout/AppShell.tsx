"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import TopBar from "../TopBar"
import Drawer from "../drawer/Drawer"
import NotificationsBell from "@/components/home/NotificationsBell"
import RoutePolish from "@/components/layout/RoutePolish"

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const showSiteHeader = pathname === "/home"
  const pageTitle = pathname === "/home" ? "Satella" : pathname.startsWith("/chat") ? "Chats" : pathname.includes("/watch-together") ? "Watch Together" : pathname.startsWith("/watch") ? "Watch" : "Satella"

  return (
    <>
      {showSiteHeader && <TopBar
        isOpen={drawerOpen}
        onMenuClick={() => setDrawerOpen((open) => !open)}
      />}
      {showSiteHeader && <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      {!showSiteHeader && (
        <>
          <div className="fixed inset-x-0 top-0 z-[100] border-b border-white/10 bg-black/80 backdrop-blur-xl">
            <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-3">
              <button onClick={() => setDrawerOpen((open) => !open)} className="rounded-xl px-3 py-1.5 text-xl text-white transition hover:bg-white/10 active:scale-95" aria-label={drawerOpen ? "Close navigation" : "Open navigation"}>
                {drawerOpen ? "✕" : "≡"}
              </button>
              <div className="rounded-xl px-3 py-1 text-xs font-medium text-white/75">{pageTitle}</div>
              <div className="rounded-xl p-0.5"><NotificationsBell /></div>
            </div>
          </div>
          <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
      )}
      <div className={showSiteHeader ? "" : "pt-12"}>{children}</div>
      <RoutePolish />
    </>
  )
}
