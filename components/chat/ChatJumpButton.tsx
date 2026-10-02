"use client"

import { useEffect, useRef, useState } from "react"

function getList() {
  return document.querySelector("main .flex-1.overflow-y-auto") as HTMLElement | null
}

export default function ChatJumpButton() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [farFromBottom, setFarFromBottom] = useState(false)
  const busy = useRef(false)

  async function markRead() {
    if (busy.current) return
    busy.current = true
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", source: "chat-bottom" }),
      })
      setUnreadCount(0)
    } finally {
      busy.current = false
    }
  }

  async function refresh() {
    const list = getList()
    if (list) {
      const distance = list.scrollHeight - list.scrollTop - list.clientHeight
      const far = distance > 650
      setFarFromBottom(far)
      if (distance < 24) {
        await markRead()
        return
      }
    }

    const response = await fetch("/api/chat/status", { cache: "no-store" })
    if (response.ok) {
      const data = await response.json()
      setUnreadCount(Number(data.unreadCount) || 0)
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 1000)
    const attach = window.setTimeout(() => {
      const list = getList()
      if (!list) return
      const onScroll = () => {
        const distance = list.scrollHeight - list.scrollTop - list.clientHeight
        setFarFromBottom(distance > 650)
        if (distance < 24) void markRead()
      }
      list.addEventListener("scroll", onScroll, { passive: true })
      onScroll()
      return () => list.removeEventListener("scroll", onScroll)
    }, 300)

    void refresh()
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(attach)
    }
  }, [])

  if (!farFromBottom) return null

  return (
    <button
      onClick={() => {
        const list = getList()
        if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
        void markRead()
        setFarFromBottom(false)
      }}
      className="fixed bottom-24 right-4 z-[45] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-zinc-950/90 text-xl shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95"
      aria-label="Go to latest message"
      title="Go to latest message"
    >
      ↓
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
