"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

const META: Record<string,[string,string]> = {
  tictactoe:["❌⭕","Tic-Tac-Toe"],connect4:["🔴🟡","Connect Four"],rps:["✊✋✌️","Rock Paper Scissors"],reaction:["⚡","Reaction Duel"],"quick-math":["➕","Quick Math Duel"],"button-smash":["🔨","Button Smash"],"target-tap":["🎯","Target Tap"],"coin-duel":["🪙","Coin Duel"],"high-low":["📈","High / Low"],"color-clash":["🎨","Color Clash"]
}

type Difficulty="easy"|"normal"|"hard"
const emptyBoard=()=>Array<string|null>(9).fill(null)
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
function winner(board:(string|null)[]){for(const l of lines)if(board[l[0]]&&board[l[0]]===board[l[1]]&&board[l[1]]===board[l[2]])return board[l[0]];return board.every(Boolean)?"draw":null}
function random<T>(a:T[]){return a[Math.floor(Math.random()*a.length)]}
function botTtt(board:(string|null)[],difficulty:Difficulty){
  const empty=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null)
  if(!empty.length)return null
  if(difficulty==="easy")return random(empty)
  const winMove=(mark:string)=>empty.find(i=>{const b=[...board];b[i]=mark;return winner(b)==mark})
  if(difficulty==="hard"){
    const win=winMove("B");if(win!==undefined)return win
    const block=winMove("A");if(block!==undefined)return block
    if(board[4]===null)return 4
    const corners=empty.filter(i=>[0,2,6,8].includes(i));if(corners.length)return random(corners)
  } else {
    const win=Math.random()<0.65?winMove("B"):undefined;if(win!==undefined)return win
    const block=Math.random()<0.7?winMove("A"):undefined;if(block!==undefined)return block
  }
  return random(empty)
}

export default function BotGame({game}:{game:string}) {
  const meta=META[game]||["🎮","Game"]
  const [difficulty,setDifficulty]=useState<Difficulty|null>(null)
  const [score,setScore]=useState({you:0,bot:0})
  const [message,setMessage]=useState("")
  const [board,setBoard]=useState<(string|null)[]>(emptyBoard())
  const [turn,setTurn]=useState<"you"|"bot">("you")
  const [choices,setChoices]=useState<{you?:string,bot?:string}>({})
  const [round,setRound]=useState<any>(null)
  const [reaction,setReaction]=useState<"idle"|"waiting"|"ready">("idle")
  const [math,setMath]=useState(()=>makeMath())
  const [smash,setSmash]=useState({you:0,bot:0})
  const [target,setTarget]=useState(()=>Math.floor(Math.random()*9))

  function makeMath(){const a=1+Math.floor(Math.random()*12),b=1+Math.floor(Math.random()*12);return {a,b,answer:a+b}}
  function chooseDifficulty(d:Difficulty){setDifficulty(d);setMessage("");setScore({you:0,bot:0});resetGameState()}
  function resetGameState(){setBoard(emptyBoard());setTurn("you");setChoices({});setRound(null);setReaction("idle");setMath(makeMath());setSmash({you:0,bot:0});setTarget(Math.floor(Math.random()*9))}
  function finish(w:"you"|"bot"|"draw"){setMessage(w==="draw"?"Draw!":w==="you"?"🏆 You win!":"🤖 Bot wins!");if(w!=="draw")setScore(s=>({...s,[w]:s[w]+1}))}
  function next(){setMessage("");resetGameState()}

  function tttMove(i:number){
    if(!difficulty||turn!=="you"||board[i]||message)return
    const b=[...board];b[i]="you";const w=winner(b);setBoard(b)
    if(w){finish(w==="you"?"you":"draw");return}
    setTurn("bot")
    setTimeout(()=>{const bi=botTtt(b,difficulty);if(bi===null)return;const n=[...b];n[bi]="bot";setBoard(n);const bw=winner(n);if(bw)finish(bw==="bot"?"bot":"draw");else setTurn("you")},difficulty==="hard"?350:220)
  }
  function playChoice(kind:string){
    if(message||choices.you)return
    const c={...choices,you:kind};setChoices(c)
    const options=kind==="rps"?["rock","paper","scissors"]:["heads","tails"]
    const bot=difficulty==="easy"?random(options):difficulty==="normal"?random(options):kind==="rps"?({rock:"paper",paper:"scissors",scissors:"rock"} as any)[kind]:kind
    const final={...c,bot};setChoices(final)
    setTimeout(()=>{
      if(kind==="rps"){const win=kind===bot?"draw":((kind==="rock"&&bot==="scissors")||(kind==="paper"&&bot==="rock")||(kind==="scissors"&&bot==="paper")?"you":"bot");finish(win as any)}
      else {const result=difficulty==="hard"?kind:random(options);finish(kind===result?"you":"bot")}
    },250)
  }
  function startReaction(){
    if(reaction!=="idle")return
    setReaction("waiting");const delay=difficulty==="easy"?1300:difficulty==="normal"?1900:2500
    setTimeout(()=>setReaction("ready"),delay)
  }
  function react(){if(reaction!=="ready")return;finish("you");setReaction("idle")}
  function answerMath(n:number){if(message)return;if(n===math.answer)finish("you");else finish("bot")}
  function smashTap(){if(message)return;const next={...smash,you:smash.you+1};setSmash(next);if(next.you>=10){finish("you");return}const chance=difficulty==="easy"?.25:difficulty==="normal"?.45:.65;if(Math.random()<chance){const b={...next,bot:next.bot+1};setSmash(b);if(b.bot>=10)finish("bot")}}
  function tapTarget(i:number){if(message)return;if(i===target){const pts=score.you+1;setScore(s=>({...s,you:s.you+1}));if(pts>=5){finish("you");return}setTarget(Math.floor(Math.random()*9))}else if(difficulty==="hard"&&Math.random()<.25)finish("bot")}
  function coin(){playChoice("heads")}
  function highLow(v:string){if(message)return;const actual=round?.number>=50?"HIGH":"LOW";if(v===actual)finish("you");else finish("bot")}
  function color(v:string){if(message)return;const correct=round?.word;if(v===correct)finish("you");else finish("bot")}
  const mathOptions=useMemo(()=>[math.answer,math.answer+1,math.answer-1,math.answer+2].sort(()=>Math.random()-.5),[math])

  if(!difficulty)return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white"><div className="mx-auto max-w-xl"><Link href="/games" className="text-sm text-white/60">← Games</Link><div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-center"><div className="text-5xl">{meta[0]}</div><h1 className="mt-3 text-2xl font-black">{meta[1]}</h1><p className="mt-2 text-sm text-white/45">Choose your bot difficulty.</p><div className="mt-6 grid gap-3"><button onClick={()=>chooseDifficulty("easy")} className="rounded-2xl bg-emerald-500/20 p-4 font-bold">🟢 Easy</button><button onClick={()=>chooseDifficulty("normal")} className="rounded-2xl bg-yellow-500/20 p-4 font-bold">🟡 Normal</button><button onClick={()=>chooseDifficulty("hard")} className="rounded-2xl bg-red-500/20 p-4 font-bold">🔴 Hard</button></div></div></div></main>

  const simpleHeader=<><div className="flex items-center justify-between"><Link href="/games" className="text-sm text-white/60">← Games</Link><span className="text-xs uppercase tracking-widest text-white/35">{difficulty} bot</span></div><div className="mt-4 text-center"><div className="text-3xl">{meta[0]}</div><h1 className="mt-1 text-xl font-black">{meta[1]}</h1><div className="mt-2 text-sm text-white/45">You {score.you} · Bot {score.bot}</div></div>{message&&<div className="mt-4 rounded-2xl bg-pink-500/15 p-3 text-center font-bold">{message}</div>}</>
  return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white"><div className="mx-auto max-w-xl"><div className="rounded-3xl border border-white/10 bg-white/5 p-5">{simpleHeader}
    {game==="tictactoe"&&<div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">{board.map((v,i)=><button key={i} disabled={!!v||turn!=="you"||!!message} onClick={()=>tttMove(i)} className="aspect-square rounded-2xl bg-white/10 text-4xl font-black">{v==="you"?"❌":v==="bot"?"⭕":""}</button>)}</div>}
    {game==="connect4"&&<ConnectFour difficulty={difficulty} message={message} finish={finish}/>} 
    {game==="rps"&&<ChoiceGame options={[["rock","✊"],["paper","✋"],["scissors","✌️"]]} choices={choices} message={message} onChoose={playChoice}/>} 
    {game==="reaction"&&<div className="mt-5"><button disabled={reaction!=="idle"||!!message} onClick={startReaction} className="w-full rounded-2xl bg-white/10 py-5 font-bold">{reaction==="idle"?"Start reaction duel":"Wait…"}</button>{reaction==="ready"&&<button onClick={react} className="mt-3 w-full rounded-2xl bg-pink-500/30 py-12 text-3xl font-black">TAP NOW!</button>}</div>}
    {game==="quick-math"&&<div className="mt-5"><div className="text-center text-4xl font-black">{math.a} + {math.b} = ?</div><div className="mt-4 grid grid-cols-2 gap-2">{mathOptions.map(n=><button key={n} disabled={!!message} onClick={()=>answerMath(n)} className="rounded-2xl bg-white/10 py-4 text-xl font-bold">{n}</button>)}</div></div>}
    {game==="button-smash"&&<div className="mt-5 text-center"><div className="text-sm text-white/50">You {smash.you} · Bot {smash.bot} · first to 10</div><button disabled={!!message} onClick={smashTap} className="mt-4 h-48 w-48 rounded-full bg-pink-500/25 text-2xl font-black">SMASH!</button></div>}
    {game==="target-tap"&&<div className="mt-5"><div className="text-center text-sm text-white/50">Tap the target · You {score.you}/5</div><div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">{Array.from({length:9},(_,i)=><button key={i} disabled={!!message} onClick={()=>tapTarget(i)} className={`aspect-square rounded-2xl text-xl font-black ${i===target?"bg-pink-500/50":"bg-white/10"}`}>{i===target?"🎯":""}</button>)}</div></div>}
    {game==="coin-duel"&&<ChoiceGame options={[["heads","🪙 Heads"],["tails","🔵 Tails"]]} choices={choices} message={message} onChoose={coin}/>} 
    {game==="high-low"&&<div className="mt-5 grid grid-cols-2 gap-3">{["HIGH","LOW"].map(v=><button key={v} disabled={!!message} onClick={()=>{if(!round)setRound({number:1+Math.floor(Math.random()*100)});setTimeout(()=>highLow(v),0)}} className="rounded-2xl bg-white/10 p-6 text-xl font-black">{v}</button>)}</div>}
    {game==="color-clash"&&<div className="mt-5"><div className="text-center text-4xl font-black">{round?.word||"RED"}</div><div className="mt-4 grid grid-cols-2 gap-2">{["RED","BLUE","GREEN","YELLOW"].map(v=><button key={v} disabled={!!message} onClick={()=>{if(!round)setRound({word:random(["RED","BLUE","GREEN","YELLOW"])});setTimeout(()=>color(v),0)}} className="rounded-2xl bg-white/10 py-4 font-bold">{v}</button>)}</div></div>}
    {message&&<button onClick={next} className="mt-5 w-full rounded-2xl bg-white/10 py-3 font-semibold">Next Round</button>}
  </div></div></main>
}

function ChoiceGame({options,choices,message,onChoose}:{options:string[][],choices:any,message:string,onChoose:(v:string)=>void}){return <div className="mt-5 grid grid-cols-2 gap-3">{options.map(([v,e])=><button key={v} disabled={!!choices.you||!!message} onClick={()=>onChoose(v)} className="rounded-2xl bg-white/10 p-6 text-lg font-bold">{e}</button>)}</div>}

function ConnectFour({difficulty,message,finish}:{difficulty:Difficulty,message:string,finish:(w:"you"|"bot"|"draw")=>void}){
  const [board,setBoard]=useState<(string|null)[]>(Array(42).fill(null));const [turn,setTurn]=useState<"you"|"bot">("you")
  function win(b:(string|null)[]){for(let r=0;r<6;r++)for(let c=0;c<7;c++){const i=r*7+c;if(!b[i])continue;for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const ids=[0,1,2,3].map(k=>{const rr=r+dr*k,cc=c+dc*k;return rr>=0&&rr<6&&cc>=0&&cc<7?rr*7+cc:-1});if(ids.every(x=>x>=0&&b[ids[0]]===b[x]))return b[i]}}return b.every(Boolean)?"draw":null}
  function drop(col:number,who:"you"|"bot"){if(message)return;const b=[...board];for(let r=5;r>=0;r--){const i=r*7+col;if(!b[i]){b[i]=who;setBoard(b);const w=win(b);if(w){finish(w as any);return}setTurn(who==="you"?"bot":"you");if(who==="you")setTimeout(()=>bot(),250);return}}}
  function bot(){const cols=Array.from({length:7},(_,i)=>i).filter(c=>!board[c]);if(!cols.length)return;let col=random(cols);if(difficulty==="hard")col=cols[Math.floor(cols.length/2)];drop(col,"bot")}
  return <div className="mt-5 grid grid-cols-7 gap-1 rounded-2xl bg-blue-950/40 p-2">{board.map((v,i)=><button key={i} disabled={turn!=="you"||!!v||!!message} onClick={()=>drop(i%7,"you")} className="aspect-square rounded-full bg-white/10 text-xl">{v==="you"?"🔴":v==="bot"?"🟡":""}</button>)}</div>
}
