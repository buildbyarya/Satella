"use client"

import { useEffect } from "react"

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function ChatSeenMeta() {
  useEffect(() => {
    let active = true

    async function syncSeenTimes() {
      const response = await fetch("/api/chat", { cache: "no-store" })
      if (!response.ok || !active) return
      const data = await response.json()
      for (const message of data.messages || []) {
        if (message.senderId !== data.userId || !message.seenByPartner || !message.seenAt) continue
        const root = document.getElementById(`msg-${message.id}`)
        const meta = root?.querySelector("div.mt-1.flex.items-center.justify-end") as HTMLElement | null
        if (!meta) continue
        meta.textContent = `${formatTime(message.createdAt)} · Seen ${formatTime(message.seenAt)}`
      }
    }

    void syncSeenTimes()
    const timer = window.setInterval(() => void syncSeenTimes(), 2200)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  return null
}
