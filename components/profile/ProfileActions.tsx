"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ProfileActions({ nickname: initialNickname }: { nickname: string }) {
  const router = useRouter()
  const [nickname, setNickname] = useState(initialNickname)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function saveNickname() {
    setBusy(true)
    setMessage("")
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    })
    setBusy(false)
    if (!response.ok) {
      setMessage("Could not save changes.")
      return
    }
    setMessage("Saved.")
    router.refresh()
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-white/10 p-4">
        <label className="text-sm text-white/60">Nickname</label>
        <div className="mt-2 flex gap-2">
          <input value={nickname} onChange={e => setNickname(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-black/30 px-3 py-2 outline-none" placeholder="Your nickname" />
          <button disabled={busy} onClick={() => void saveNickname()} className="rounded-xl bg-white/15 px-4 py-2 active:scale-95 disabled:opacity-50">Save</button>
        </div>
      </div>
      <p className="text-xs text-white/40">Profile pictures can be changed with image uploads in Account Settings.</p>
      {message && <p className="text-sm text-white/60">{message}</p>}
    </div>
  )
}
