"use client"
import Link from "next/link"

export default function GamesHub(){
 return <div className="space-y-5">
  <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
   <div className="text-xs uppercase tracking-widest text-pink-300/70">Games lobby</div>
   <h2 className="mt-1 text-2xl font-black">🎮 Games</h2>
   <p className="mt-2 text-sm text-white/50">We’re rebuilding the games section from the ground up. The old placeholder games have been removed so you won’t run into unfinished or fake game screens.</p>
  </section>
  <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
   <div className="text-xs uppercase tracking-widest text-pink-300/70">First game</div>
   <h3 className="mt-1 text-2xl font-black">🎨 Drawing Swap</h3>
   <p className="mt-2 text-sm text-white/50">Draw together, then exchange canvases every 45 seconds and continue the other person’s drawing.</p>
   <Link href="/games/drawing-swap" className="mt-4 block w-full rounded-2xl bg-pink-500/25 px-4 py-3 text-center font-bold">Open Drawing Swap</Link>
  </section>
 </div>
}
