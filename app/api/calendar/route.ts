import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CALENDAR_BG_TITLE = "__SATELLA_CALENDAR_BACKGROUND__"

async function ctx(){
  const s=await getServerSession(authOptions)
  if(!s?.user?.email)return null
  const u=await prisma.user.findUnique({where:{email:s.user.email}})
  if(!u)return null
  const m=await prisma.homeMember.findUnique({where:{userId:u.id}})
  return m?{u,m}:null
}

export async function GET(){
  const c=await ctx()
  if(!c)return NextResponse.json({error:"Unauthorized"},{status:401})
  const events=await prisma.calendarEvent.findMany({where:{homeId:c.m.homeId,title:{not:CALENDAR_BG_TITLE}},orderBy:{startAt:"asc"}})
  const bg=await prisma.calendarEvent.findFirst({where:{homeId:c.m.homeId,title:CALENDAR_BG_TITLE},orderBy:{updatedAt:"desc"}})
  return NextResponse.json({events,background:bg?.description||""})
}

export async function POST(req:Request){
  const c=await ctx()
  if(!c)return NextResponse.json({error:"Unauthorized"},{status:401})
  const b=await req.json()
  if(b.action==="background"){
    const value=typeof b.background==="string"?b.background.slice(0,6000000):""
    const existing=await prisma.calendarEvent.findFirst({where:{homeId:c.m.homeId,title:CALENDAR_BG_TITLE}})
    const saved=existing
      ? await prisma.calendarEvent.update({where:{id:existing.id},data:{description:value}})
      : await prisma.calendarEvent.create({data:{homeId:c.m.homeId,title:CALENDAR_BG_TITLE,description:value,startAt:new Date(),allDay:true,color:"#000000"}})
    return NextResponse.json({background:saved.description})
  }
  if(b.action==="delete"){
    await prisma.calendarEvent.deleteMany({where:{id:String(b.id),homeId:c.m.homeId,title:{not:CALENDAR_BG_TITLE}}})
    return NextResponse.json({ok:true})
  }
  if(b.action==="update"){
    const id=String(b.id)
    const existing=await prisma.calendarEvent.findFirst({where:{id,homeId:c.m.homeId,title:{not:CALENDAR_BG_TITLE}}})
    if(!existing)return NextResponse.json({error:"Event not found"},{status:404})
    const e=await prisma.calendarEvent.update({where:{id},data:{
      title:String(b.title||"Untitled"),description:String(b.description||""),
      startAt:new Date(b.startAt),endAt:b.endAt?new Date(b.endAt):null,
      allDay:Boolean(b.allDay),color:String(b.color||"#f9a8d4")
    }})
    return NextResponse.json({event:e})
  }
  const e=await prisma.calendarEvent.create({data:{
    homeId:c.m.homeId,title:String(b.title||"Untitled"),description:String(b.description||""),
    startAt:new Date(b.startAt),endAt:b.endAt?new Date(b.endAt):null,
    allDay:Boolean(b.allDay),color:String(b.color||"#f9a8d4")
  }})
  return NextResponse.json({event:e})
}
