"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type Message = {
  id:string; senderId:string; senderName:string; content:string
  kind:"TEXT"|"IMAGE"|"VOICE"|"VIDEO"; pinned:boolean; editedAt:string|null
  createdAt:string; replyTo:any; media:any; reactions:Record<string,{count:number;mine:boolean}>
  seenByPartner:boolean; seenAt:string|null
  style:{fontSize:number;textColor:string;fontFamily:string;bubbleColor:string}
}
type Preference={fontSize:number;textColor:string;fontFamily:string;bubbleColor:string}
type Setting={background:string;backgroundImage:string|null}

const emojis=["❤️","😂","🥺","😍","😭","😘","🫶","🔥","✨","👍","👀","💀"]
function textFromHtml(html:string){const el=document.createElement("div");el.innerHTML=html;return el.textContent||el.innerText||""}
function formatTime(v:string){return new Date(v).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
function contrastColor(hex:string){const m=hex.replace("#","").match(/.{1,2}/g);if(!m||m.length<3)return "#fff";const [r,g,b]=m.map(x=>parseInt(x,16));return (r*299+g*587+b*114)>150000?"#111":"#fff"}
function health(n:number){return n>=3?"❤️":n===2?"❤️‍🩹":n===1?"💔":"🖤"}

export default function ChatMessages(){
 const [messages,setMessages]=useState<Message[]>([])
 const [currentUserId,setCurrentUserId]=useState("")
 const [setting,setSetting]=useState<Setting|null>(null)
 const [pref,setPref]=useState<Preference>({fontSize:16,textColor:"#fff",fontFamily:"system-ui",bubbleColor:"#7c3aed"})
 const [reply,setReply]=useState<Message|null>(null),[editing,setEditing]=useState<Message|null>(null)
 const [searchDraft,setSearchDraft]=useState(""),[search,setSearch]=useState(""),[searchIndex,setSearchIndex]=useState(0),[showSearch,setShowSearch]=useState(false)
 const [showPinned,setShowPinned]=useState(false),[showSettings,setShowSettings]=useState(false),[showFormat,setShowFormat]=useState(false)
 const [sending,setSending]=useState(false),[recording,setRecording]=useState(false),[menuId,setMenuId]=useState<string|null>(null)
 const [openingMedia,setOpeningMedia]=useState<string|null>(null)
 const [mediaView,setMediaView]=useState<{kind:string;data:string;mime:string}|null>(null)
 const [backgroundImage,setBackgroundImage]=useState(""),[sharedSaving,setSharedSaving]=useState(false)
 const editor=useRef<HTMLDivElement>(null),list=useRef<HTMLDivElement>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]),savedRange=useRef<Range|null>(null),stickToBottom=useRef(true),initialScrollDone=useRef(false)

 async function load(){
   const r=await fetch("/api/chat",{cache:"no-store"});if(!r.ok)return
   const d=await r.json();setCurrentUserId(d.userId||"");setMessages(d.messages||[]);setSetting(d.setting||null)
   if(d.preference)setPref(d.preference);if(d.setting?.backgroundImage)setBackgroundImage(d.setting.backgroundImage)
 }
 useEffect(()=>{void load();const t=setInterval(()=>void load(),2200);return()=>clearInterval(t)},[])
 useEffect(()=>{
   const node=list.current
   if(!node)return
   if(stickToBottom.current&&!search){node.scrollTop=node.scrollHeight;void fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",source:"chat-bottom"})})}
 },[messages.length,search])

 const results=useMemo(()=>{
   const q=search.trim().toLowerCase();if(!q)return []
   return messages.filter(m=>m.kind==="TEXT").map((m,i)=>({m,i,text:textFromHtml(m.content).toLowerCase()})).filter(x=>x.text.includes(q))
 },[messages,search])
 useEffect(()=>{if(!search){setSearchIndex(0);return}if(results.length)setSearchIndex(results.length-1)},[search,results.length])

 function handleScroll(){
   const node=list.current;if(!node)return
   const distance=node.scrollHeight-node.scrollTop-node.clientHeight
   stickToBottom.current=distance<80
   if(distance<80)void fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",source:"chat-bottom"})})
 }
 function scrollToBottom(){const node=list.current;if(node){stickToBottom.current=true;node.scrollTo({top:node.scrollHeight,behavior:"smooth"})}}
 function performSearch(){setSearch(searchDraft.trim());setSearchIndex(0)}
 function jump(id:string){const el=document.getElementById("msg-"+id);el?.scrollIntoView({behavior:"smooth",block:"center"});el?.classList.add("ring-2","ring-pink-300");setTimeout(()=>el?.classList.remove("ring-2","ring-pink-300"),1100)}
 function jumpSearch(delta:number){if(!results.length)return;const next=(searchIndex+delta+results.length)%results.length;setSearchIndex(next);jump(results[next].m.id)}
 function rememberSelection(){
  const root=editor.current,sel=window.getSelection()
  if(!root||!sel||!sel.rangeCount)return
  const range=sel.getRangeAt(0)
  if(root.contains(range.commonAncestorContainer))savedRange.current=range.cloneRange()
 }
 function restoreSelection(){
  const root=editor.current,sel=window.getSelection(),range=savedRange.current
  if(!root||!sel||!range||!root.contains(range.commonAncestorContainer))return false
  sel.removeAllRanges();sel.addRange(range);return true
 }
 function bakeCurrentTextStyle(){
  const root=editor.current;if(!root)return
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  const nodes:Array<Text>=[]
  let node:Node|null
  while((node=walker.nextNode()))if((node.textContent||"").replace(/\u200b/g,""))nodes.push(node as Text)
  for(const text of nodes){
    let el=text.parentElement
    while(el&&el!==root){
      if(el.tagName==="SPAN"&&el.getAttribute("data-satella-style")==="1")break
      el=el.parentElement
    }
    if(el&&el!==root){
      if(!el.style.fontSize)el.style.fontSize=pref.fontSize+"px"
      if(!el.style.color)el.style.color=pref.textColor
      if(!el.style.fontFamily)el.style.fontFamily=pref.fontFamily
      continue
    }
    const span=document.createElement("span")
    span.setAttribute("data-satella-style","1")
    span.style.fontSize=pref.fontSize+"px"
    span.style.color=pref.textColor
    span.style.fontFamily=pref.fontFamily
    text.parentNode?.insertBefore(span,text)
    span.appendChild(text)
  }
 }
 function applyInlineStyle(property:"fontSize"|"color"|"fontFamily",value:string){
  const root=editor.current;if(!root)return;root.focus();restoreSelection()
  const sel=window.getSelection();if(!sel||!sel.rangeCount)return
  bakeCurrentTextStyle();restoreSelection()
  const nextSel=window.getSelection();if(!nextSel||!nextSel.rangeCount)return
  const range=nextSel.getRangeAt(0);if(!root.contains(range.commonAncestorContainer))return
  const span=document.createElement("span");span.setAttribute("data-satella-style","1");span.style[property]=value
  if(range.collapsed){
    span.appendChild(document.createTextNode("\u200b"));range.insertNode(span)
    const next=document.createRange();next.setStart(span.firstChild!,1);next.collapse(true);nextSel.removeAllRanges();nextSel.addRange(next)
  }else{
    span.appendChild(range.extractContents());range.insertNode(span)
    const next=document.createRange();next.setStartAfter(span);next.collapse(true);nextSel.removeAllRanges();nextSel.addRange(next)
  }
  savedRange.current=nextSel.getRangeAt(0).cloneRange()
 }
 function command(name:string,value?:string){editor.current?.focus();document.execCommand(name,false,value)}
 function clearEditor(){if(editor.current)editor.current.innerHTML=""}

 async function send(){
   if(!editor.current)return;const content=editor.current.innerHTML.trim().replace(/\\u200b/g,"");if(!textFromHtml(content).trim())return
   setSending(true);await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:editing?"edit":"send",messageId:editing?.id,content,replyToId:reply?.id})})
   clearEditor();setReply(null);setEditing(null);setSending(false);stickToBottom.current=true;await load();requestAnimationFrame(()=>scrollToBottom())
 }
 async function fileSend(file:File){
   if(!(file.type.startsWith("image/")||file.type.startsWith("video/")))return
   if(file.size>4_500_000){alert("Please choose a media file under 4.5 MB.");return}
   const reader=new FileReader();reader.onload=async()=>{await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send",kind:file.type.startsWith("video/")?"VIDEO":"IMAGE",content:String(reader.result),mime:file.type})});stickToBottom.current=true;await load();requestAnimationFrame(()=>scrollToBottom())};reader.readAsDataURL(file)
 }
 async function startVoice(){
   if(recording){recorder.current?.stop();setRecording(false);return}
   try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});const r=new MediaRecorder(stream);chunks.current=[];recorder.current=r
    r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)}
    r.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks.current,{type:r.mimeType||"audio/webm"});if(blob.size>4_500_000){alert("Voice message is too large.");return};const reader=new FileReader();reader.onload=async()=>{await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"send",kind:"VOICE",content:String(reader.result),mime:blob.type})});stickToBottom.current=true;await load();requestAnimationFrame(()=>scrollToBottom())};reader.readAsDataURL(blob)}
    r.start();setRecording(true)
   }catch{alert("Microphone permission is required for voice messages.")}
 }
 async function openMedia(message:Message){
   if(openingMedia||!message.media?.available||message.media.remaining<=0)return
   setOpeningMedia(message.id)
   try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"view-media",messageId:message.id})});const d=await r.json();if(d.data)setMediaView({kind:message.kind,data:d.data,mime:d.mime||message.media.mime||"application/octet-stream"});void load()}finally{setOpeningMedia(null)}
 }
 async function downloadMedia(message:Message){
   if(!message.media?.available||message.media.remaining<=0)return
   const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"view-media",messageId:message.id,download:true})});const d=await r.json();if(!d.data)return
   const a=document.createElement("a");a.href=d.data;a.download="satella-"+message.kind.toLowerCase();a.click();void load()
 }
 async function act(action:string,id:string,extra:any={}){await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,messageId:id,...extra})});setMenuId(null);void load()}
 async function saveSharedBackground(){setSharedSaving(true);await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"shared-settings",backgroundImage:backgroundImage||null})});setSharedSaving(false);setShowSettings(false);void load()}
 async function saveStyle(next:Partial<Preference>){const value={...pref,...next};setPref(value);await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"style",...value})})}

 const pinned=useMemo(()=>messages.filter(m=>m.pinned),[messages])
 const pageBackground=setting?.backgroundImage?{backgroundImage:"url("+setting.backgroundImage+")",backgroundSize:"cover",backgroundPosition:"center"}:{background:setting?.background||"linear-gradient(135deg,#160b2e,#050505,#2a0a22)"}

 return <main className="fixed inset-x-0 top-12 bottom-0 z-10 min-h-0 overflow-hidden text-white" style={pageBackground}>
  <div className="h-full min-h-0 bg-black/35"><div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
   <header className="fixed left-0 right-0 top-12 z-40 border-b border-white/10 bg-black/70 px-3 py-2 backdrop-blur-xl">
    <div className="flex items-center gap-2">
     <a href="/home" className="rounded-xl bg-white/10 px-3 py-2">‹</a><div className="min-w-0 flex-1"><div className="font-bold">💬 Our Chat</div><div className="text-[11px] text-white/45">Shared space</div></div>
     <button onClick={()=>setShowSearch(v=>!v)} className="rounded-xl bg-white/10 px-2.5 py-2" aria-label="Search chat">🔎</button><button onClick={()=>setShowPinned(v=>!v)} className="rounded-xl bg-white/10 px-2.5 py-2">📌</button><button onClick={()=>setShowSettings(true)} className="rounded-xl bg-white/10 px-2.5 py-2">🎨</button>
    </div>
    {showSearch&&<div className="mt-2 flex gap-1.5">
      <input autoFocus value={searchDraft} onChange={e=>setSearchDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")performSearch()}} placeholder="Search chat…" className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none"/>
      <button onClick={()=>jumpSearch(-1)} disabled={!results.length} className="rounded-xl bg-white/10 px-3 disabled:opacity-30" aria-label="Older search result">↑</button>
      <button onClick={()=>jumpSearch(1)} disabled={!results.length} className="rounded-xl bg-white/10 px-3 disabled:opacity-30" aria-label="Newer search result">↓</button>
      <button onClick={()=>{setShowSearch(false);setSearch("");setSearchDraft("")}} className="rounded-xl bg-white/10 px-3" aria-label="Close search">×</button>
    </div>}{showSearch&&search&&<div className="mt-1 px-1 text-[10px] text-white/45">{results.length?`Match ${searchIndex+1} of ${results.length}`:`No text messages found`}</div>}
   </header>

   {showPinned&&<div className="border-b border-white/10 bg-black/45 p-3"><div className="mb-2 text-sm font-semibold">Pinned messages</div>{pinned.length?<div className="space-y-1.5">{pinned.map(m=><button key={m.id} onClick={()=>jump(m.id)} className="block w-full rounded-xl bg-white/10 p-2 text-left text-sm">{textFromHtml(m.content).slice(0,120)}</button>)}</div>:<div className="text-sm text-white/40">Nothing pinned yet.</div>}</div>}

   <div ref={list} data-chat-scroll-container="true" onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-2 pt-32 pb-2 sm:px-4"><div className="space-y-2.5">
    {messages.map(m=>{
      const own=m.senderId===currentUserId,bubble=m.style?.bubbleColor||(own?pref.bubbleColor:"#27272a"),dotsColor=contrastColor(bubble),match=search?results.some(x=>x.m.id===m.id):false
      return <div id={"msg-"+m.id} data-chat-message="true" key={m.id} className={"flex "+(own?"justify-end":"justify-start")+" "+(match?"rounded-xl ring-1 ring-yellow-300/40":"")}>
       <div className="relative max-w-[84%] sm:max-w-[72%]">
        {!own&&<div className="mb-0.5 px-2 text-[11px] font-semibold text-pink-200">{m.senderName}</div>}
        <div className="relative rounded-2xl px-3 py-2 shadow-lg" style={{background:bubble,color:m.style?.textColor||"#fff",fontSize:m.style?.fontSize||16,fontFamily:m.style?.fontFamily||"system-ui"}}>
         {m.replyTo&&<button onClick={()=>jump(m.replyTo.id)} className="mb-1.5 w-full rounded-xl border-l-2 border-white/45 bg-black/20 px-2 py-1.5 text-left text-xs"><b>{m.replyTo.senderName}</b><div className="truncate opacity-65">{textFromHtml(m.replyTo.content)}</div></button>}
         {m.kind==="TEXT"?<div className="break-words whitespace-pre-wrap [&_a]:underline" dangerouslySetInnerHTML={{__html:m.content}}/>:<button onClick={()=>void openMedia(m)} disabled={openingMedia===m.id||m.media?.remaining<=0} className="flex min-w-44 items-center gap-2 text-left disabled:opacity-50"><span className="text-xl">{health(m.media?.remaining||0)}</span><span><b>{m.kind==="IMAGE"?"🖼️ Temporary image":m.kind==="VIDEO"?"🎬 Temporary video":"🎙️ Voice message"}</b><span className="block text-xs opacity-65">{openingMedia===m.id?"Opening…":m.media?.remaining?m.media.remaining+" views left":"Used / expired"}</span></span></button>}
         <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-55">{formatTime(m.createdAt)}{m.editedAt?" · edited":""}{own?(m.seenByPartner&&m.seenAt?" · Seen "+formatTime(m.seenAt):" · Sent"):""}</div>
         <button onClick={()=>setMenuId(menuId===m.id?null:m.id)} aria-label="Message actions" className="absolute -top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/80 shadow" style={{color:dotsColor}}>⋯</button>
         {menuId===m.id&&<div className="absolute z-20 top-6 right-0 min-w-40 rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
          <button onClick={()=>{setReply(m);setMenuId(null)}} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">↩ Reply</button>
          <button onClick={()=>void act("pin",m.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">{m.pinned?"📌 Unpin":"📌 Pin"}</button>
          {m.kind==="TEXT"&&<button onClick={()=>{setEditing(m);if(editor.current)editor.current.innerHTML=m.content;setMenuId(null)}} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">✏️ Edit</button>}
          <button onClick={()=>navigator.clipboard?.writeText(textFromHtml(m.content))} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">📋 Copy</button>
          {m.kind!=="TEXT"&&m.media?.available&&<button onClick={()=>{setMenuId(null);void downloadMedia(m)}} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">⬇️ Download (uses 1 view)</button>}
          {m.senderId===currentUserId&&<button onClick={()=>void act("delete",m.id)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10">🗑️ Delete</button>}
          <div className="flex flex-wrap gap-1 p-1">{emojis.slice(0,6).map(e=><button key={e} onClick={()=>void act("react",m.id,{emoji:e})} className="rounded-lg bg-white/10 px-2 py-1 text-xs">{e}</button>)}</div>
         </div>}
        </div>
        {Object.keys(m.reactions||{}).length>0&&<div className={"mt-0.5 flex gap-1 "+(own?"justify-end":"justify-start")}>{Object.entries(m.reactions).map(([e,r])=><span key={e} className="rounded-full bg-black/65 px-2 py-0.5 text-[11px]">{e} {r.count}</span>)}</div>}
       </div>
      </div>
    })}
   </div></div>

   <div className="shrink-0 border-t border-white/10 bg-black/65 p-2.5 backdrop-blur-xl">
    {reply&&<div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 p-2 text-xs"><button onClick={()=>jump(reply.id)} className="min-w-0 flex-1 text-left"><b>Replying to {reply.senderName}</b><div className="truncate opacity-55">{textFromHtml(reply.content)}</div></button><button onClick={()=>setReply(null)}>×</button></div>}
    {editing&&<div className="mb-2 flex items-center justify-between rounded-xl bg-pink-500/10 px-3 py-2 text-xs">Editing message<button onClick={()=>{setEditing(null);clearEditor()}}>Cancel</button></div>}
    {showFormat&&<div className="mb-2 rounded-2xl bg-zinc-50 p-2 text-black shadow-xl"><div className="flex flex-wrap gap-1">
      <button onClick={()=>command("bold")} className="rounded-lg px-3 py-2 font-bold">B</button><button onClick={()=>command("italic")} className="rounded-lg px-3 py-2 italic">I</button><button onClick={()=>command("underline")} className="rounded-lg px-3 py-2 underline">U</button><button onClick={()=>command("strikeThrough")} className="rounded-lg px-3 py-2">S̶</button>
      <label className="flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1.5 text-xs">Size
        <select value={pref.fontSize} onMouseDown={rememberSelection} onChange={e=>{const v=Number(e.target.value);void saveStyle({fontSize:v});applyInlineStyle("fontSize",v+"px")}} className="bg-transparent px-1 py-1 text-sm"><option value={10}>10px</option>{Array.from({length:22},(_,i)=>i+11).map(v=><option key={v} value={v}>{v}px</option>)}</select>
      </label>
      <label className="flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1.5 text-xs">Text
        <input type="color" value={pref.textColor} onMouseDown={rememberSelection} onChange={e=>{void saveStyle({textColor:e.target.value});applyInlineStyle("color",e.target.value)}} title="Text color" className="h-7 w-8 rounded"/>
      </label>
      <label className="flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1.5 text-xs">Font
        <select value={pref.fontFamily} onMouseDown={rememberSelection} onChange={e=>{void saveStyle({fontFamily:e.target.value});applyInlineStyle("fontFamily",e.target.value)}} className="max-w-24 bg-transparent px-1 py-1 text-sm"><option value="system-ui">System</option><option value="Georgia">Serif</option><option value="monospace">Mono</option><option value="Arial">Arial</option><option value="Trebuchet MS">Trebuchet</option></select>
      </label>
      <label className="flex flex-col gap-1 rounded-lg bg-black/5 px-2 py-1.5 text-xs">Bubble
        <span className="flex items-center gap-1"><input type="color" value={pref.bubbleColor} onChange={e=>void saveStyle({bubbleColor:e.target.value})} title="Message bubble color" className="h-7 w-8 rounded"/><span>Color</span></span>
        <button type="button" onClick={()=>void saveStyle({fontSize:16,textColor:"#fff",bubbleColor:"#7c3aed"})} className="rounded-md bg-black/10 px-2 py-1 text-[11px] hover:bg-black/15">↩ Default style</button>
      </label>
    </div><p className="mt-1 px-1 text-[10px] text-black/45">Text size/color/font apply to the text you type next. Bubble color applies to your whole message bubble. Your partner can choose their own.</p></div>}
    <div className="flex items-end gap-1.5">
     <button onClick={()=>setShowFormat(v=>!v)} className="rounded-xl bg-white/10 px-3 py-3 font-bold">Aa</button>
     <label className="cursor-pointer rounded-xl bg-white/10 px-3 py-3">📷<input type="file" accept="image/*,video/*" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void fileSend(file);e.currentTarget.value=""}}/></label>
     <button onClick={()=>void startVoice()} className={"rounded-xl px-3 py-3 "+(recording?"bg-red-500/40":"bg-white/10")}>{recording?"⏹️":"🎙️"}</button>
     <div ref={editor} contentEditable suppressContentEditableWarning data-placeholder="Type a message…" className="max-h-28 min-h-11 flex-1 overflow-y-auto rounded-xl bg-white/10 px-3 py-2.5 text-sm outline-none" onInput={rememberSelection} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onBlur={rememberSelection}/>
     <button disabled={sending} onClick={()=>void send()} className="rounded-xl bg-pink-500/70 px-4 py-3 font-semibold disabled:opacity-50">➤</button>
    </div>
   </div>
  </div></div>

  {showSettings&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-3xl bg-zinc-950 p-5 shadow-2xl">
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Shared chat background</h2><button onClick={()=>setShowSettings(false)}>×</button></div><p className="mt-1 text-sm text-white/45">This picture is shared and visible to both of you.</p>
    <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm">{backgroundImage?<img src={backgroundImage} alt="" className="max-h-32 rounded-xl object-cover"/>:"🖼️ Choose a background picture"}<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>setBackgroundImage(String(reader.result));reader.readAsDataURL(f)}}/></label>
    <button disabled={sharedSaving} onClick={()=>void saveSharedBackground()} className="mt-4 w-full rounded-xl bg-pink-500/30 py-3 font-semibold">{sharedSaving?"Saving…":"Save shared background"}</button>
    <button onClick={()=>{setBackgroundImage("");void saveSharedBackground()}} className="mt-2 w-full rounded-xl bg-white/10 py-3 text-sm">Remove background picture</button>
  </div></div>}

  {mediaView&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={()=>setMediaView(null)}><div className="relative max-h-[90vh] max-w-4xl" onClick={e=>e.stopPropagation()}>
    <button onClick={()=>setMediaView(null)} className="absolute -right-2 -top-10 rounded-full bg-white/10 px-3 py-2">×</button>
    {mediaView.kind==="IMAGE"&&<img src={mediaView.data} alt="Temporary media" className="max-h-[82vh] max-w-full rounded-2xl object-contain"/>}
    {mediaView.kind==="VIDEO"&&<video src={mediaView.data} controls autoPlay className="max-h-[82vh] max-w-full rounded-2xl"/>}
    {mediaView.kind==="VOICE"&&<div className="rounded-2xl bg-zinc-900 p-5"><audio src={mediaView.data} controls autoPlay/></div>}
  </div></div>}
 </main>
}
