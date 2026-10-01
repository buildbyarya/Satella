"use client"
import {useEffect,useState} from "react"
import Link from "next/link"
import PageHeader from "@/components/common/PageHeader"

type State=any
const META:any={
 tictactoe:["❌⭕","Tic-Tac-Toe"],connect4:["🔴🟡","Connect Four"],rps:["✊✋✌️","Rock Paper Scissors"],reaction:["⚡","Reaction Duel"],"quick-math":["➕","Quick Math Duel"],"button-smash":["🔨","Button Smash"],"target-tap":["🎯","Target Tap"],"coin-duel":["🪙","Coin Duel"],"high-low":["📈","High / Low"],"color-clash":["🎨","Color Clash"]}

export default function PhaseOneGame({params}:{params:{game:string}}){
 const game=params.game;const meta=META[game]||["🎮","Game"];const [s,setS]=useState<State>(null),[side,setSide]=useState("A"),[members,setMembers]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState("")
 async function load(){const r=await fetch(`/api/games/phase-one?game=${encodeURIComponent(game)}`,{cache:"no-store"});if(!r.ok)return;const d=await r.json();setS(d.state);setSide(d.side);setMembers(d.members)}
 useEffect(()=>{void load();const t=setInterval(()=>void load(),900);return()=>clearInterval(t)},[game])
 async function act(action:string,payload:any={}){setBusy(true);setMessage("");await fetch("/api/games/phase-one",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({game,action,payload})});await load();setBusy(false)}
 const other=side==="A"?"B":"A"
 const done=s?.winner||s?.draw||s?.result
 function reset(){void act("reset")}
 function resultText(){if(!s)return "";if(s.winner==="DRAW"||s.result==="DRAW")return "Draw!";if(s.winner)return s.winner===side?"🏆 You win!":"😅 Partner wins!";return ""}
 return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white"><div className="mx-auto max-w-xl"><PageHeader title={`${meta[0]} ${meta[1]}`} backHref="/games"/><div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
 <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-widest text-white/40">Phase 1 · Easy</div><div className="mt-1 font-semibold">You are Player {side}</div></div><div className="text-right text-sm text-white/50">{members}/2 connected</div></div>
 {members<2&&<div className="mt-4 rounded-2xl bg-yellow-500/10 p-3 text-sm text-yellow-100">Waiting for your partner to open this game on their device.</div>}
 {resultText()&&<div className="mt-4 rounded-2xl bg-pink-500/15 p-4 text-center text-xl font-bold">{resultText()}</div>}
 {game==="tictactoe"&&s&&<div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">{s.board.map((v:string,i:number)=><button key={i} disabled={!!v||s.turn!==side||!!done||busy} onClick={()=>void act("move",{index:i})} className="aspect-square rounded-2xl bg-white/10 text-4xl font-black hover:bg-white/15">{v==="A"?"❌":v==="B"?"⭕":""}</button>)}</div>}
 {game==="connect4"&&s&&<div className="mt-5 grid grid-cols-7 gap-1 rounded-2xl bg-blue-950/40 p-2">{s.board.map((v:string,i:number)=><button key={i} disabled={!!v||s.turn!==side||!!done||busy} onClick={()=>void act("drop",{col:i%7})} className="aspect-square rounded-full bg-white/10 text-xl">{v==="A"?"🔴":v==="B"?"🟡":""}</button>)}</div>}
 {game==="rps"&&s&&<div className="mt-5 grid grid-cols-3 gap-2">{[["rock","✊"],["paper","✋"],["scissors","✌️"]].map(([v,e])=><button key={v} disabled={!!s.choices[side]||!!done||busy} onClick={()=>void act("choose",{choice:v})} className="rounded-2xl bg-white/10 p-5 text-3xl">{e}<span className="mt-2 block text-xs">{v}</span></button>)}</div>}
 {game==="reaction"&&s&&<div className="mt-5 text-center"><button disabled={s.status!=="idle"||busy} onClick={()=>void act("start")} className="w-full rounded-2xl bg-white/10 py-8 text-lg font-bold">{s.status==="idle"?"Start reaction duel":"Wait for the signal…"}</button>{s.status==="ready"&&<button onClick={()=>void act("react")} className="mt-3 w-full rounded-2xl bg-pink-500/30 py-10 text-2xl font-black">TAP NOW!</button>}</div>}
 {game==="quick-math"&&s&&<div className="mt-5 text-center"><div className="text-5xl font-black">{s.a} + {s.b} = ?</div><div className="mt-4 grid grid-cols-2 gap-2">{[s.answer,s.answer+1,s.answer-1,s.answer+2].sort(()=>Math.random()-.5).map((n:number,i:number)=><button key={i} disabled={!!done||busy} onClick={()=>void act("answer",{answer:n})} className="rounded-2xl bg-white/10 py-4 text-xl font-bold">{n}</button>)}</div></div>}
 {game==="button-smash"&&s&&<div className="mt-5 text-center"><div className="text-sm text-white/50">{s.scores.A} — {s.scores.B} · first to {s.target}</div><button disabled={!!done||busy} onClick={()=>void act("tap")} className="mt-4 h-48 w-48 rounded-full bg-pink-500/25 text-2xl font-black">SMASH!</button></div>}
 {game==="target-tap"&&s&&<div className="mt-5 text-center"><div className="text-sm text-white/50">Score {s.scores.A} — {s.scores.B} · hit target {s.target}</div><div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">{Array.from({length:9},(_,i)=><button key={i} disabled={!!done||busy} onClick={()=>void act("tap",{target:i})} className="aspect-square rounded-2xl bg-white/10 text-xl">{i}</button>)}</div></div>}
 {game==="coin-duel"&&s&&<div className="mt-5 grid grid-cols-2 gap-3">{["heads","tails"].map(v=><button key={v} disabled={!!s.choices[side]||!!done||busy} onClick={()=>void act("choose",{choice:v})} className="rounded-2xl bg-white/10 p-6 text-lg font-bold">{v==="heads"?"🪙 Heads":"🔵 Tails"}</button>)}</div>}
 {game==="high-low"&&s&&<div className="mt-5 text-center"><div className="text-sm text-white/50">Will the hidden result be HIGH or LOW?</div><div className="mt-4 grid grid-cols-2 gap-3">{["HIGH","LOW"].map(v=><button key={v} disabled={!!s.choices[side]||!!done||busy} onClick={()=>void act("choose",{choice:v})} className="rounded-2xl bg-white/10 p-6 text-xl font-black">{v}</button>)}</div></div>}
 {game==="color-clash"&&s&&<div className="mt-5 text-center"><div className="text-sm text-white/50">Choose the colour named by the word</div><div className="mt-3 text-4xl font-black">{s.word}</div><div className="mt-4 grid grid-cols-2 gap-2">{["RED","BLUE","GREEN","YELLOW"].map(v=><button key={v} disabled={!!s.choices[side]||!!done||busy} onClick={()=>void act("choose",{choice:v})} className="rounded-2xl bg-white/10 py-4 font-bold">{v}</button>)}</div></div>}
 {done&&<button onClick={reset} disabled={busy} className="mt-5 w-full rounded-2xl bg-white/10 py-3 font-semibold">Play again</button>}
 <div className="mt-5 text-center text-xs text-white/30">Live sync uses the shared Home. Keep both devices on this screen.</div>
 </div></div></main>
}
