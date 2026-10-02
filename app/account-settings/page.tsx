"use client"
import PageHeader from "@/components/common/PageHeader"
import {signOut} from "next-auth/react"
import {useEffect,useState} from "react"

export default function AccountSettingsPage(){
 const [image,setImage]=useState(""),[name,setName]=useState(""),[email,setEmail]=useState(""),[saving,setSaving]=useState(false),[message,setMessage]=useState("")
 const [home,setHome]=useState<any>(null),[deleteModal,setDeleteModal]=useState(false),[standaloneDeleteModal,setStandaloneDeleteModal]=useState(false),[deleting,setDeleting]=useState(false)
 async function loadDeletion(){const r=await fetch("/api/home/delete-request",{cache:"no-store"});if(r.ok)setHome(await r.json())}
 useEffect(()=>{fetch("/api/account/profile",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.user){setImage(d.user.image||"");setName(d.user.nickname||d.user.name||"");setEmail(d.user.email||"")}});void loadDeletion()},[])
 async function upload(file:File){
  if(file.size>3_300_000){setMessage("Please choose an image under 3.3 MB.");return}
  const reader=new FileReader();reader.onload=async()=>{setSaving(true);setMessage("");const r=await fetch("/api/account/profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:String(reader.result)})});const d=await r.json();setMessage(r.ok?"Profile picture updated.":d.error||"Could not update picture.");setSaving(false)};reader.readAsDataURL(file)
 }
 async function requestDeletion(){
  setDeleting(true);setMessage("")
  const r=await fetch("/api/home/delete-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"request"})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok){setMessage(d.error||"Could not start the deletion request.");setDeleting(false);return}
  setDeleteModal(false);await loadDeletion();setDeleting(false)
 }
 async function finalInactiveDelete(){
  if(!home?.request?.id)return
  setDeleting(true);setMessage("")
  const r=await fetch("/api/home/delete-request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"final-confirm",requestId:home.request.id})})
  const d=await r.json().catch(()=>({}))
  if(!r.ok){setMessage(d.error||"The Home cannot be deleted yet.");setDeleting(false);return}
  await signOut({callbackUrl:"/"})
 }
 async function deleteStandaloneAccount(){
  setDeleting(true);setMessage("")
  const r=await fetch("/api/account/profile",{method:"DELETE"});const d=await r.json().catch(()=>({}))
  if(!r.ok){setMessage(d.error||"Could not delete account.");setDeleting(false);return}
  await signOut({callbackUrl:"/"})
 }
 const req=home?.request
 const hasActiveRequest=Boolean(req)
 return <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-6 text-white"><div className="mx-auto max-w-md"><PageHeader title="⚙ Account Settings" backHref="/home"/>
  <div className="mt-6 rounded-3xl bg-white/10 p-6">
   <div className="flex flex-col items-center"><div className="h-28 w-28 overflow-hidden rounded-full border border-white/15 bg-white/10">{image?<img src={image} alt="Profile" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-4xl">👤</div>}</div>
    <label className="mt-4 cursor-pointer rounded-xl bg-pink-500/25 px-4 py-2 font-semibold">{saving?"Saving…":"📷 Choose profile picture"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value=""}}/></label>
   </div>
   <div className="mt-6 space-y-2 text-sm"><div className="rounded-xl bg-black/20 p-3"><span className="text-white/40">Name</span><div>{name||"Not set"}</div></div><div className="rounded-xl bg-black/20 p-3"><span className="text-white/40">Email</span><div>{email}</div></div></div>
   {message&&<p className="mt-4 text-center text-sm text-white/60">{message}</p>}
  </div>
  <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-500/10 p-6">
   <div className="text-xs uppercase tracking-widest text-red-200/60">Danger zone</div>
   <h2 className="mt-1 text-lg font-bold text-red-100">Delete Home &amp; Account</h2>
   <p className="mt-2 text-sm text-red-100/65">This permanently removes the shared Home, both members' Satella accounts, chats, saved YouTube data, playlists, calendar, games, notes, backgrounds, settings, sessions and Google account linkage.</p>
   {hasActiveRequest&&req.role==="requester"&&req.decision==="PENDING"&&<div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">Deletion request sent. Waiting for your partner to answer Yes or No.</div>}
   {hasActiveRequest&&req.role==="requester"&&req.decision==="NO"&&<div className="mt-4 rounded-2xl border border-red-500/60 bg-red-500/10 p-3 text-sm text-red-100">Your partner has not agreed. The request remains pending and can be changed later from Notifications.</div>}
   {hasActiveRequest&&req.role==="requester"&&req.decision==="YES"&&<div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">Your partner agreed. They now have the final irreversible confirmation.</div>}
   {hasActiveRequest&&req.role==="requester"&&req.inactiveEligible&&<button onClick={()=>void finalInactiveDelete()} disabled={deleting} className="mt-3 w-full rounded-xl bg-red-500/30 px-4 py-3 font-bold disabled:opacity-50">{deleting?"Deleting…":"Partner inactive for 3 days — delete Home & accounts"}</button>}
   {!home?.hasHome?<button onClick={()=>setStandaloneDeleteModal(true)} disabled={deleting} className="mt-4 w-full rounded-xl bg-red-500/30 px-4 py-3 font-bold disabled:opacity-50">Delete account</button>:!hasActiveRequest&&<button type="button" onClick={()=>setDeleteModal(true)} disabled={deleting} className="mt-4 w-full rounded-xl bg-red-500/30 px-4 py-3 font-bold disabled:opacity-50">Delete Home &amp; Account</button>}
   <a href="/support" className="mt-3 block text-center text-xs text-white/45 underline">Need help leaving a Home? Contact Support.</a>
  </div>
 </div>
 {standaloneDeleteModal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"><div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-zinc-950 p-6 shadow-2xl"><h2 className="text-xl font-bold text-red-100">Delete this account?</h2><p className="mt-3 text-sm leading-6 text-white/70">This permanently deletes this standalone Satella account and its account-owned data. There is no Home attached to this account.</p><p className="mt-3 text-sm font-semibold text-red-200">You will need to register again with Google if you return to Satella.</p><div className="mt-5 flex gap-2"><button onClick={()=>setStandaloneDeleteModal(false)} className="flex-1 rounded-xl bg-white/10 py-3">Cancel</button><button onClick={()=>{setStandaloneDeleteModal(false);void deleteStandaloneAccount()}} disabled={deleting} className="flex-1 rounded-xl bg-red-500/30 py-3 font-bold disabled:opacity-50">{deleting?"Deleting…":"Delete permanently"}</button></div></div></div>}
 {deleteModal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"><div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-zinc-950 p-6 shadow-2xl"><h2 className="text-xl font-bold text-red-100">Delete Home &amp; Account?</h2><p className="mt-3 text-sm leading-6 text-white/70">This sends a request to your partner. They must choose Yes before deletion can happen. If they choose No, nothing is deleted and the request stays red in Notifications for later.</p><p className="mt-3 text-sm font-semibold text-red-200">You will both lose all saved data permanently if the request is approved.</p><div className="mt-5 flex gap-2"><button onClick={()=>setDeleteModal(false)} className="flex-1 rounded-xl bg-white/10 py-3">Cancel</button><button onClick={()=>void requestDeletion()} disabled={deleting} className="flex-1 rounded-xl bg-red-500/30 py-3 font-bold disabled:opacity-50">{deleting?"Sending…":"Yes, send request"}</button></div></div></div>}
 </main>
}
