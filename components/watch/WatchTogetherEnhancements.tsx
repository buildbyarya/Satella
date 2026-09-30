"use client"

import { useEffect, useRef, useState } from "react"

type Playlist = { id: string; name: string; videos: string[] }
type Room = { videoId: string; otherPresent: boolean }

export default function WatchTogetherEnhancements() {
  const [roomId, setRoomId] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [liked, setLiked] = useState(false)
  const [watchLater, setWatchLater] = useState(false)
  const [playlists, setPlaylists] = useState<{ personal: Playlist | null; common: Playlist | null }>({ personal: null, common: null })
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const lastChatCount = useRef<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRoomId(params.get("roomId") || "")
  }, [])

  function chatScroller(): HTMLElement | null {
    const heading = Array.from(document.querySelectorAll<HTMLElement>("*")).find(el => el.textContent?.trim() === "💬 Watch Together Chat")
    const card = heading?.parentElement?.parentElement
    return card?.querySelector<HTMLElement>("[class*='overflow-y-auto']") || null
  }

  async function load() {
    if (!roomId) return
    const [roomRes, sourcesRes, playlistsRes, chatRes] = await Promise.all([
      fetch(`/api/youtube/watch-together?roomId=${encodeURIComponent(roomId)}`, { cache: "no-store" }),
      fetch(`/api/youtube/watch-together?roomId=${encodeURIComponent(roomId)}&sources=1`, { cache: "no-store" }),
      fetch("/api/youtube/playlists", { cache: "no-store" }),
      fetch(`/api/youtube/watch-together?roomId=${encodeURIComponent(roomId)}&chat=1`, { cache: "no-store" }),
    ])

    let currentVideoId = room?.videoId || ""
    if (roomRes.ok) {
      const d = await roomRes.json()
      currentVideoId = d?.room?.videoId || currentVideoId
      setRoom(d.room || null)
    }
    if (sourcesRes.ok) {
      const d = await sourcesRes.json()
      setLiked(Boolean(currentVideoId && (d.liked || []).some((v: any) => v.id === currentVideoId)))
      setWatchLater(Boolean(currentVideoId && (d.watchLater || []).some((v: any) => v.id === currentVideoId)))
    }
    if (playlistsRes.ok) setPlaylists(await playlistsRes.json())
    if (chatRes.ok) {
      const d = await chatRes.json()
      const count = (d.chat || []).length
      const scroller = chatScroller()
      if (lastChatCount.current !== null && count > lastChatCount.current) {
        const atBottom = !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80
        if (atBottom) {
          requestAnimationFrame(() => { if (scroller) scroller.scrollTop = scroller.scrollHeight })
          setUnread(0)
        } else {
          setUnread(v => v + (count - lastChatCount.current!))
        }
      }
      lastChatCount.current = count
    }
  }

  useEffect(() => {
    if (!roomId) return
    void load()
    const timer = setInterval(() => void load(), 1200)
    return () => clearInterval(timer)
  }, [roomId])

  async function toggleLibrary(type: "LIKED" | "WATCH_LATER") {
    if (!room?.videoId || saving) return
    setSaving(type)
    const exists = type === "LIKED" ? liked : watchLater
    await fetch("/api/youtube/library", {
      method: exists ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: room.videoId, type }),
    })
    if (type === "LIKED") setLiked(!exists)
    else setWatchLater(!exists)
    setSaving(null)
  }

  async function addToPlaylist(playlistId: string) {
    if (!room?.videoId) return
    setSaving(playlistId)
    await fetch("/api/youtube/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId, videoId: room.videoId }),
    })
    setSaving(null)
    setPlaylistOpen(false)
  }

  function jumpToLatest() {
    const scroller = chatScroller()
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" })
    setUnread(0)
  }

  if (!roomId || !room?.videoId) return null

  return <>
    <div className="fixed bottom-3 left-1/2 z-[85] w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <button disabled={saving === "LIKED"} onClick={() => void toggleLibrary("LIKED")} className="flex-1 rounded-xl bg-white/10 px-2 py-2 text-xs font-medium transition hover:bg-white/15 disabled:opacity-50">{liked ? "❤️ Liked" : "♡ Like"}</button>
        <button disabled={saving === "WATCH_LATER"} onClick={() => void toggleLibrary("WATCH_LATER")} className="flex-1 rounded-xl bg-white/10 px-2 py-2 text-xs font-medium transition hover:bg-white/15 disabled:opacity-50">{watchLater ? "🔖 Saved" : "🔖 Watch Later"}</button>
        <button onClick={() => setPlaylistOpen(v => !v)} className="flex-1 rounded-xl bg-white/10 px-2 py-2 text-xs font-medium transition hover:bg-white/15">📁 Playlist</button>
        {unread > 0 && <button onClick={jumpToLatest} className="relative rounded-xl bg-white/10 px-3 py-2 text-sm" aria-label="Jump to latest chat">↓<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold">{unread > 9 ? "9+" : unread}</span></button>}
      </div>
      {playlistOpen && <div className="absolute bottom-14 right-0 w-64 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
        <p className="px-2 py-1.5 text-xs text-white/50">Add current video to…</p>
        {playlists.personal && <button disabled={Boolean(saving)} onClick={() => void addToPlaylist(playlists.personal!.id)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10">📁 Personal Playlist</button>}
        {playlists.common && <button disabled={Boolean(saving)} onClick={() => void addToPlaylist(playlists.common!.id)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10">👥 Common Playlist</button>}
      </div>}
    </div>
  </>
}
