"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

const META: Record<string,[string,string]> = {
  tictactoe:["❌⭕","Tic-Tac-Toe"], connect4:["🔴🟡","Connect Four"], rps:["✊✋✌️","Rock Paper Scissors"], reaction:["⚡","Reaction Duel"],
  "quick-math":["➕","Quick Math Duel"], "button-smash":["🔨","Button Smash"], "target-tap":["🎯","Target Tap"], "coin-duel":["🪙","Coin Duel"], "high-low":["📈","High / Low"], "color-clash":["🎨","Color Clash"],
}

export default function BotGame({game}:{game:string}) {
  const [difficulty,setDifficulty]=useState<string|null>(null)
  const [wins,setWins]=useState(0)
  const [round,setRound]=useState(0)
  const [message,setMessage]=useState("")
  const [ttt,setTtt]=useState<(string|null)[]>(Array(9).fill(null))
  const [turn,setTurn]=useState<"you"|"bot">("you")
  const [score,setScore]=useState({you:0,bot:0})
  const meta=META[game]||["🎮","Game"]
  const hard= difficulty==="hard"

  function chooseDifficulty(d:string){setDifficulty(d);setMessage("");setRound(0);setWins(0);setScore({you:0,bot:0});setTtt(Array(9).fill(null));setTurn("you")}
  function endRound(winner:"you"|"bot"|"draw"){
    if(winner==="you")setScore(s=>({...s,you:s.you+1})); else if(winner==="bot")setScore(s=>({...s,bot:s.bot+1}));
    setMessage(winner==="draw"?"Draw!":winner==="you"?"🏆 You win!":"🤖 Bot wins!")
    setRound(r=>r+1)
  }
  function botMove(board:(string|null)[]){
    const empty=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null)
    if(!empty.length)return
    let pick=empty[Math.floor(Math.random()*empty.length)]
    if(hard){
      const center=board[4]===null?4:null; if(center!==null)pick=center
      else { const corners=[0,2,6,8].filter(i=>board[i]===null); if(corners.length)pick=corners[0] }
    }
    const next=[...board];next[pick]="B";setTtt(next);setTurn("you")
  }
  function move(i:number){
    if(!difficulty||game!=="tictactoe"||turn!=="you"||ttt[i])return
    const next=[...ttt];next[i]="A";setTtt(next)
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    const win=lines.some(l=>l.every(x=>next[x]==="A"));if(win){endRound("you");return}
    if(next.every(Boolean)){endRound("draw");return}
    setTurn("bot");setTimeout(()=>botMove(next),difficulty==="hard"?450:250)
  }
  function simpleRound(){
    const chance=difficulty==="easy"?.72:difficulty==="normal"?.55:.42
    const winner=Math.random()<chance?"you":"bot" as "you"|"bot"
    endRound(winner)
  }

  if(!difficulty) return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white"><div className="mx-auto max-w-xl"><Link href="/games" className="text-sm text-white/60">← Games</Link><div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-center"><div className="text-5xl">{meta[0]}</div><h1 className="mt-3 text-2xl font-black">{meta[1]}</h1><p className="mt-2 text-sm text-white/45">Play against a Satella bot.</p><div className="mt-6 grid gap-3"><button onClick={()=>chooseDifficulty("easy")} className="rounded-2xl bg-emerald-500/20 p-4 font-bold">🟢 Easy</button><button onClick={()=>chooseDifficulty("normal")} className="rounded-2xl bg-yellow-500/20 p-4 font-bold">🟡 Normal</button><button onClick={()=>chooseDifficulty("hard")} className="rounded-2xl bg-red-500/20 p-4 font-bold">🔴 Hard</button></div></div></div></main>

  return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white"><div className="mx-auto max-w-xl"><div className="flex items-center justify-between"><Link href="/games" className="text-sm text-white/60">← Games</Link><span className="text-xs uppercase tracking-widest text-white/35">{difficulty} bot</span></div><div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5"><div className="text-center"><div className="text-3xl">{meta[0]}</div><h1 className="mt-1 text-xl font-black">{meta[1]}</h1><div className="mt-2 text-sm text-white/45">You {score.you} · Bot {score.bot}</div></div>{message&&<div className="mt-4 rounded-2xl bg-pink-500/15 p-3 text-center font-bold">{message}</div>}
{game==="tictactoe"?<div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">{ttt.map((v,i)=><button key={i} disabled={!!v||turn!=="you"||!!message} onClick={()=>move(i)} className="aspect-square rounded-2xl bg-white/10 text-4xl font-black">{v==="A"?"❌":v==="B"?"⭕":""}</button>)}</div>:<div className="mt-6"><button onClick={simpleRound} disabled={!!message} className="w-full rounded-2xl bg-pink-500/25 py-8 text-xl font-black">PLAY ROUND</button><p className="mt-3 text-center text-xs text-white/35">Difficulty changes the bot's odds and reaction strategy.</p></div>}
{message&&<button onClick={()=>{setMessage("");if(game==="tictactoe"){setTtt(Array(9).fill(null));setTurn("you")}}} className="mt-5 w-full rounded-2xl bg-white/10 py-3 font-semibold">Next Round</button>}
</div></div></main>
}
