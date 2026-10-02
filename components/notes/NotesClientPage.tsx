"use client"

import { useCallback, useEffect, useState } from "react"
import NotesEditor from "./NotesEditor"
import NotesSettings from "./NotesSettings"

type Mode = "personal" | "other" | "shared"

type NoteData = {
  id: string | null
  content: string
  checkboxMode: boolean
  isPrivate: boolean
  backgroundImage?: string | null
  canEdit: boolean
  locked: boolean
  updatedAt?: string | null
  updatedBy?: string | null
}

export default function NotesClientPage({ mode, title }: { mode: Mode; title: string }) {
  const [data, setData] = useState<NoteData | null>(null)

  const load = useCallback(async () => {
    const response = await fetch(`/api/notes?type=${mode}`, { cache: "no-store" })
    if (!response.ok) return
    setData(await response.json())
  }, [mode])

  useEffect(() => {
    void load()
    if (mode === "personal") return

    const timer = setInterval(() => {
      if (document.activeElement?.closest("[contenteditable=true]")) return
      void load()
    }, 30000)

    return () => clearInterval(timer)
  }, [load, mode])

  async function changeSettings(next: { checkboxMode?: boolean; isPrivate?: boolean; backgroundImage?: string | null }) {
    if (!data) return
    const response = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: mode, ...next }),
    })
    if (response.ok) setData(await response.json())
  }

  if (!data) {
    return <div className="mt-8 rounded-3xl bg-white/5 p-8 text-center text-white/50">Loading notes…</div>
  }

  return (
    <div className="w-full">
      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-pink-200/50">
            {mode === "other" ? "Read only" : mode === "shared" ? "Shared notebook" : "Your notebook"}
          </p>
          <h2 className="mt-1 text-xl font-bold">{title}</h2>
          {mode === "shared" && data.updatedAt ? (
            <p className="mt-1 text-xs text-white/45">
              Last edited by <span className="font-medium text-white/70">{data.updatedBy || "User"}</span> · {new Date(data.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
          ) : null}
        </div>
        {data.canEdit ? (
          <NotesSettings
            mode={mode === "shared" ? "shared" : "personal"}
            checkboxMode={data.checkboxMode}
            isPrivate={data.isPrivate}
            backgroundImage={data.backgroundImage}
            onChange={changeSettings}
          />
        ) : null}
      </div>

      <NotesEditor
        mode={mode}
        initialContent={data.content}
        initialCheckboxMode={data.checkboxMode}
        canEdit={data.canEdit}
        locked={data.locked}
        backgroundImage={data.backgroundImage}
        onSaved={() => void load()}
      />
    </div>
  )
}
