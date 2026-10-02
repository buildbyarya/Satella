"use client"

import { useEffect, useRef, useState } from "react"

function getList() {
  return document.querySelector('[data-chat-scroll-container="true"]') as HTMLElement | null
}

function getMetrics(list: HTMLElement) {
  const distance = Math.max(0, list.scrollHeight - list.scrollTop - list.clientHeight)
  const items = Array.from(list.querySelectorAll("[data-chat-message=\"true\"]")) as HTMLElement[]
  const viewportBottom = list.scrollTop + list.clientHeight
  const belowCount = items.filter((item) => item.offsetTop + item.offsetHeight > viewportBottom + 8).length
  const requiredBelow = Math.min(10, items.length)
  const farEnough = distance > 220 && belowCount >= requiredBelow
  return { distance, farEnough }
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
      const { distance, farEnough } = getMetrics(list)
      setFarFromBottom(farEnough)
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
    let list: HTMLElement | null = null
    let attachTimer: number | null = null

    const onScroll = () => void refresh()

    const attach = () => {
      list = getList()
      if (!list) return
      list.addEventListener("scroll", onScroll, { passive: true })
      onScroll()
    }

    attachTimer = window.setTimeout(attach, 80)
    const timer = window.setInterval(() => void refresh(), 1000)
    void refresh()

    return () => {
      if (attachTimer !== null) window.clearTimeout(attachTimer)
      window.clearInterval(timer)
      list?.removeEventListener("scroll", onScroll)
    }
  }, [])

  if (!farFromBottom) return null

  return (
    <button
      onClick={() => {
        const list = getList()
        if (list) {
          list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
        }
        void markRead()
        setFarFromBottom(false)
      }}
      className="fixed bottom-36 right-4 z-[80] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-zinc-950/95 text-xl shadow-2xl backdrop-blur-xl transition hover:scale-105 active:scale-95"
      aria-label="Go to latest message"
      title="Go to latest message"
    >
      ↓
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 shadow" aria-label="Unread messages" />
      )}
    </button>
  )
}
