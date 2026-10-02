"use client"
import {useEffect,useState} from "react"
import {createPortal} from "react-dom"
import {usePathname,useRouter} from "next/navigation"
import {signOut} from "next-auth/react"

export default function NotificationsBell(){
 const[a,setA]=useState<any[]>([]);const[events,setEvents]=useState<any[]>([]);const[open,setOpen]=useState(false);const[reply,setReply]=useState<{id:string;text:string}|null>(null);const[toast,setToast]=useState<any>(null);const router=useRouter();const pathname=usePathname()
 const toastKey="satella-watch-invite-toasts-v1"
 function getToastHistory(){try{const raw=JSON.parse(localStorage.getItem(toastKey)||"[]");const cutoff=Date.now()-60*60*1000;return Array.isArray(raw)?raw.filter((x:any)=>x&&Number(x.at)>cutoff):[]}catch{return[]}}
 function rememberToast(id:string){try{const next=[...getToastHistory(),{id,at:Date.now()}].slice(-3);localStorage.setItem(toastKey,JSON.stringify(next))}catch{}}
 async function load(){
  const r=await fetch("/api/notifications",{cache:"no-store"});if(!r.ok)return
  const d=await r.json();setA(d.notifications||[])
  const visibleEvents=(d.events||[]).filter((x:any)=>!(pathname?.startsWith("/chat")&&x.kind==="chat"))
  setEvents(visibleEvents)
  const history=getToastHistory();const shown=new Set(history.map((x:any)=>x.id))
  const recent=[...(d.notifications||[]).map((x:any)=>({...x,type:"invite"})),...visibleEvents]
    .filter((x:any)=>!x.createdAt||Date.now()-Date.parse(x.createdAt)<60*60*1000)
  const fresh=recent.filter((x:any)=>!shown.has(x.id))
  if(fresh.length&&history.length<3){
   const item=fresh[0];setToast(item);rememberToast(item.id)
   if(item.kind==="chat")setTimeout(()=>setToast((current:any)=>current?.id===item.id?null:current),9000)
  }
 }
 useEffect(()=>{void load();const t=setInterval(load,1500);return()=>clearInterval(t)},[pathname])
 async function respond(id:string,x:string,msg?:string){
  setToast(null);const r=await fetch("/api/youtube/watch-together",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"respond",inviteId:id,response:x,message:msg})})
  const d=await r.json()
  if(!r.ok){setReply(null);setToast({id:"error-"+Date.now(),type:"event",text:d?.error||"Could not respond to the invitation.",kind:"error"});return}
  setReply(null);setOpen(false);await load()
  if(x==="accept"&&d.roomId)router.push("/watch/youtube/watch-together?roomId="+encodeURIComponent(d.roomId))
 }
 function startReply(id:string){setToast(null);setOpen(false);setReply({id,text:""})}
 async function respondHomeDelete(requestId:string,decision:"YES"|"NO"|"FINAL"){
  if(decision==="FINAL"){
   const r=await fetch("/api/home/delete-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"final-confirm",requestId})})
   const d=await r.json().catch(()=>({}))
   if(!r.ok){setToast({id:"delete-error-"+Date.now(),type:"event",text:d.error||"The Home could not be deleted.",kind:"error"});return}
   setToast(null);setOpen(false);await signOut({callbackUrl:"/"});return
  }
  const r=await fetch("/api/home/delete-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"respond",requestId,decision})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok){setToast({id:"delete-error-"+Date.now(),type:"event",text:d.error||"Could not update the deletion request.",kind:"error"});return}
  if(decision==="YES"){
   setToast({id:"home-delete-final-"+requestId,type:"home-delete",phase:"final",requestId,text:"This is irreversible. All Home data and both Satella accounts will be permanently deleted."})
  }else{setToast(null);await load()}
 }
 function openEvent(event:any){if(event.kind==="chat"){setOpen(false);router.push("/chat/messages")}}
 function homeDeleteCard(i:any){
  if(i.phase==="final")return <div key={i.id} className="mb-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3"><p className="text-sm font-semibold text-red-100">{i.text}</p><button onClick={()=>void respondHomeDelete(i.requestId,"FINAL")} className="mt-2 w-full rounded-lg bg-red-500/30 px-2 py-2 text-sm font-bold">YES, delete everything</button></div>
  return <div key={i.id} className={"mb-2 rounded-xl border p-3 "+(i.danger?"border-red-500/60 bg-red-500/10":"border-white/10 bg-white/5")}><p className="text-sm">{i.text}</p><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={()=>void respondHomeDelete(i.requestId,"YES")} className="rounded-lg bg-white/10 px-2 py-2 text-sm">Yes, leave & delete</button><button onClick={()=>void respondHomeDelete(i.requestId,"NO")} className="rounded-lg bg-white/10 px-2 py-2 text-sm">No</button></div></div>
 }
 return <div className="relative">
  <button onClick={()=>setOpen(v=>!v)} className="rounded-xl px-2 py-1 text-xl transition hover:bg-white/10" aria-label="Notifications">🔔{(a.length>0||events.length>0)&&<span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500"/>}</button>
  {toast&&typeof document!=="undefined"&&createPortal(
    <div className="fixed left-1/2 top-4 z-[1000] w-[calc(100vw-24px)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
      <p className="text-center text-sm font-medium leading-5">{toast.text}</p>
      {toast.customMessage&&<p className="mt-1 text-center text-xs text-white/60">💬 {toast.customMessage}</p>}
      {toast.type==="invite" ? <div className="mt-3 grid grid-cols-3 gap-2"><button onClick={()=>void respond(toast.id,"accept")} className="rounded-xl bg-white/10 px-2 py-2.5 text-sm">Accept</button><button onClick={()=>void respond(toast.id,"decline")} className="rounded-xl bg-white/10 px-2 py-2.5 text-sm">Decline</button><button onClick={()=>startReply(toast.id)} className="rounded-xl bg-white/10 px-2 py-2.5 text-sm">💬 Reply</button></div>
       :toast.type==="home-delete"&&toast.phase==="request" ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>void respondHomeDelete(toast.requestId,"YES")} className="rounded-xl bg-white/10 px-2 py-2.5 text-sm">Yes, leave & delete</button><button onClick={()=>void respondHomeDelete(toast.requestId,"NO")} className="rounded-xl bg-white/10 px-2 py-2.5 text-sm">No</button></div>
       :toast.type==="home-delete"&&toast.phase==="final" ? <button onClick={()=>void respondHomeDelete(toast.requestId,"FINAL")} className="mt-3 w-full rounded-xl bg-red-500/30 py-2.5 font-bold">YES, delete everything</button>
       : <button onClick={()=>setToast(null)} className="mt-3 w-full rounded-xl bg-white/10 py-2.5">OK</button>}
    </div>,document.body)}
  {reply&&<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"><p className="font-medium">Reply to Watch Together invitation</p><input autoFocus value={reply.text} onChange={e=>setReply({...reply,text:e.target.value})} onKeyDown={e=>e.key==="Enter"&&reply.text.trim()&&void respond(reply.id,"reply",reply.text.trim())} placeholder="Write a message… 😀" className="mt-4 w-full rounded-xl bg-black/40 px-3 py-3 text-sm outline-none"/><div className="mt-3 flex gap-2"><button onClick={()=>setReply(null)} className="flex-1 rounded-xl bg-white/10 py-3">Cancel</button><button disabled={!reply.text.trim()} onClick={()=>void respond(reply.id,"reply",reply.text.trim())} className="flex-1 rounded-xl bg-white/10 py-3 disabled:opacity-40">Send</button></div></div></div>}
  {open&&<div className="absolute right-0 top-12 z-[70] w-80 rounded-2xl border border-white/10 bg-zinc-950 p-3 shadow-2xl">{a.length===0&&events.length===0?<p className="p-3 text-sm text-white/50">No new notifications.</p>:<>{a.map(i=><div key={i.id} className="mb-2 rounded-xl bg-white/5 p-3"><p className="text-sm">{i.text}</p>{i.customMessage&&<p className="mt-1 text-xs text-white/50">💬 {i.customMessage}</p>}<div className="mt-2 flex gap-2"><button onClick={()=>void respond(i.id,"accept")} className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm">Accept</button><button onClick={()=>void respond(i.id,"decline")} className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm">Decline</button><button onClick={()=>startReply(i.id)} className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm">💬 Reply</button></div></div>)}{events.map(i=>i.kind==="home-delete"?homeDeleteCard(i):<button key={i.id} onClick={()=>openEvent(i)} className={"mb-2 block w-full rounded-xl p-3 text-left text-sm hover:bg-white/10 "+(i.danger?"border border-red-500/60 bg-red-500/10":"bg-white/5")}>{i.text}</button>)}</>}</div>}
 </div>
}
