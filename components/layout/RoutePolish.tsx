"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import WatchTogetherEnhancements from "@/components/watch/WatchTogetherEnhancements"

function CalendarBackground() {
  const [background, setBackground] = useState<string>("")
  const [open, setOpen] = useState(false)
  const presets = [
    "linear-gradient(135deg,#170b2f,#080812,#2a0a22)",
    "linear-gradient(135deg,#082f49,#0f172a,#172554)",
    "linear-gradient(135deg,#3b0764,#171717,#4c0519)",
    "linear-gradient(135deg,#052e16,#111827,#164e63)",
  ]

  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null
    if (main) { main.style.background = "transparent"; main.style.backgroundImage = "none" }
    fetch("/api/calendar", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(d => { if (d?.background) setBackground(d.background) }).catch(() => {})
  }, [])

  async function save(value: string) {
    setBackground(value)
    await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "background", background: value || null }) })
    setOpen(false)
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 5_000_000) return
    const reader = new FileReader()
    reader.onload = () => void save(String(reader.result))
    reader.readAsDataURL(file)
  }

  const style = background?.startsWith("data:image/") ? { backgroundImage: `url(${background})` } : background ? { background } : undefined
  return <>
    <div className="fixed inset-0 z-0 bg-zinc-950" style={style} />
    <div className="fixed right-3 top-16 z-[80]">
      <button onClick={() => setOpen(v => !v)} className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm shadow-xl backdrop-blur-xl">🎨</button>
      {open && <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl">
        <p className="mb-2 text-xs text-white/50">Shared calendar background</p>
        <div className="grid grid-cols-2 gap-2">{presets.map((preset, i) => <button key={i} onClick={() => void save(preset)} className="h-14 rounded-xl border border-white/10" style={{ background: preset }} aria-label={`Calendar background ${i + 1}`} />)}</div>
        <label className="mt-2 block cursor-pointer rounded-xl bg-white/10 px-3 py-2 text-center text-sm hover:bg-white/15">Upload background<input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f) }} /></label>
        <button onClick={() => void save("")} className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm">Default</button>
      </div>}
    </div>
  </>
}

export default function RoutePolish() {
  const pathname = usePathname()
  if (pathname === "/calendar") return <CalendarBackground />
  if (pathname.includes("/watch/youtube/watch-together")) return <WatchTogetherEnhancements />
  return null
}
