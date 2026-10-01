"use client"

import Link from "next/link"
import { useState } from "react"

const phaseOne = [
  ["tictactoe","❌⭕","Tic-Tac-Toe","Classic 3×3 strategy"],
  ["connect4","🔴🟡","Connect Four","Drop four in a row"],
  ["rps","✊✋✌️","Rock Paper Scissors","Best your partner"],
  ["reaction","⚡","Reaction Duel","Tap on the signal"],
  ["quick-math","➕","Quick Math Duel","Solve first"],
  ["button-smash","🔨","Button Smash","First to the target"],
  ["target-tap","🎯","Target Tap","Race to five hits"],
  ["coin-duel","🪙","Coin Duel","Pick the winning side"],
  ["high-low","📈","High / Low","Predict the result"],
  ["color-clash","🎨","Color Clash","Choose the named colour"],
]

const phaseTwo = [
  ["pong","🏓","Pong Duel","Keep the ball alive"],
  ["air-hockey","🏒","Air Hockey","Score before your partner"],
  ["penalty","⚽","Penalty Shootout","Beat the keeper"],
  ["basketball","🏀","Basketball Duel","Race for points"],
  ["mini-golf","⛳","Mini Golf","Lowest score wins"],
  ["memory","🧠","Memory Match","Find matching pairs"],
  ["maze-race","🧩","Maze Race","Reach the goal first"],
  ["target-range","🎯","Target Range","Hit moving targets"],
  ["tower-balance","🏗️","Tower Balance","Keep your stack standing"],
  ["quick-race","🏎️","Quick Race","First to the finish"],
]

function GameCard({game}:{game:string[]}) {
  const [id, emoji, name, desc] = game
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 font-semibold">{name}</div>
      <div className="mt-1 text-xs text-white/45">{desc}</div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/games/phase-one/${id}`} className="rounded-xl bg-pink-500/20 px-3 py-2 text-center text-xs font-semibold hover:bg-pink-500/30">Invite Partner</Link>
        <Link href={`/games/bot/${id}`} className="rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-semibold hover:bg-white/15">Play with Bot</Link>
      </div>
    </div>
  )
}

export default function GamesHub() {
  const [authority, setAuthority] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState("")

  async function invite() {
    setInviting(true); setMessage("")
    try {
      const r = await fetch("/api/games/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authority }) })
      const data = await r.json()
      setMessage(data.message || (r.ok ? "Game invitation sent." : "Could not send the invitation."))
    } catch { setMessage("Could not send the invitation. Please try again.") }
    finally { setInviting(false) }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
        <div className="text-xs uppercase tracking-widest text-pink-300/70">Games lobby</div>
        <h2 className="mt-1 text-2xl font-black">👥 Invite Partner</h2>
        <p className="mt-2 text-sm text-white/50">Invite your partner into the gaming room. They can keep using another Satella section until they accept.</p>
        <button onClick={invite} disabled={inviting} className="mt-4 w-full rounded-2xl bg-pink-500/25 px-4 py-3 font-bold hover:bg-pink-500/35 disabled:opacity-50">{inviting ? "Sending…" : "Send Games Invitation"}</button>
        <button onClick={()=>setAuthority(v=>!v)} className={`mt-2 w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${authority ? "bg-red-500/30 text-red-100" : "bg-emerald-500/25 text-emerald-100"}`}>
          {authority ? "🔴 Authority enabled" : "🟢 Give Partner Game Authority"}
        </button>
        <p className="mt-2 text-center text-[11px] text-white/35">Authority lets your partner choose the game; their selection starts automatically.</p>
        {message && <div className="mt-3 rounded-xl bg-white/5 p-3 text-center text-xs text-white/70">{message}</div>}
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between"><div><div className="text-xs uppercase tracking-widest text-white/35">Phase 1</div><h3 className="text-xl font-bold">Easy games</h3></div><span className="text-xs text-white/30">10 games</span></div>
        <div className="grid gap-3 sm:grid-cols-2">{phaseOne.map(g=><GameCard key={g[0]} game={g}/>)}</div>
      </section>
      <section>
        <div className="mb-3 flex items-end justify-between"><div><div className="text-xs uppercase tracking-widest text-white/35">Phase 2</div><h3 className="text-xl font-bold">Medium games</h3></div><span className="text-xs text-white/30">10 games</span></div>
        <div className="grid gap-3 sm:grid-cols-2">{phaseTwo.map(g=><GameCard key={g[0]} game={g}/>)}</div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="font-semibold">🧩 Bigger games</div>
        <p className="mt-1 text-sm text-white/40">Drawing Swap, Snake, Nuts & Bolts, Liquid Sort and Animal Stack remain in the larger multiplayer-game track.</p>
        <Link href="/games/drawing-swap" className="mt-3 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold">Open Drawing Swap</Link>
      </section>
    </div>
  )
}
