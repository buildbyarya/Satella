import {getServerSession} from "next-auth"
import {NextResponse} from "next/server"
import {authOptions} from "@/lib/auth"
import {prisma} from "@/lib/prisma"

export async function GET(){
 const s=await getServerSession(authOptions);if(!s?.user?.email)return NextResponse.json({notifications:[],events:[]},{status:401})
 const u=await prisma.user.findUnique({where:{email:s.user.email}});if(!u)return NextResponse.json({notifications:[],events:[]},{status:401})
 const since=new Date(Date.now()-120000)
 const home=await prisma.homeMember.findUnique({where:{userId:u.id},include:{home:{include:{members:true}}}})
 const partner=home?.home.members.find(m=>m.userId!==u.id)
 const [incoming,responded,replies,rooms]=await Promise.all([
  prisma.watchInvite.findMany({where:{recipientId:u.id,status:"PENDING",expiresAt:{gt:new Date()}},include:{sender:true},orderBy:{createdAt:"desc"}}),
  prisma.watchInvite.findMany({where:{senderId:u.id,status:{in:["DECLINED","ACCEPTED"]},respondedAt:{gt:since}},include:{recipient:true},orderBy:{respondedAt:"desc"}}),
  prisma.watchInvite.findMany({where:{senderId:u.id,status:"PENDING",customMessage:{not:null},createdAt:{gt:since}},include:{recipient:true},orderBy:{createdAt:"desc"}}),
  partner?prisma.watchRoomMember.findMany({where:{userId:partner.userId,leftAt:{not:null,gt:since}},orderBy:{leftAt:"desc"},take:5}):Promise.resolve([]),
 ])
 const chatAfterLeave:any[]=[]
 for(const room of rooms){
  if(!room.leftAt)continue
  const msg=await prisma.chatMessage.findFirst({where:{homeId:home!.homeId,senderId:partner!.userId,createdAt:{gt:room.leftAt}},orderBy:{createdAt:"desc"}})
  if(msg&&msg.createdAt.getTime()-room.leftAt.getTime()<=120000){
   chatAfterLeave.push({id:"chat-after-leave-"+msg.id,text:(partner!.nickname||"Your partner")+" sent a message in Chat",kind:"chat",chatMessageId:msg.id,createdAt:msg.createdAt.toISOString()})
  }
 }
 return NextResponse.json({
  notifications:incoming.map(i=>({id:i.id,text:(i.sender.nickname||i.sender.name||"Someone")+" invited you to watch YouTube",customMessage:i.customMessage,createdAt:i.createdAt.toISOString(),expiresAt:i.expiresAt.toISOString()})),
  events:[
   ...responded.map(i=>({id:(i.status==="ACCEPTED"?"accepted-":"declined-")+i.id,text:(i.recipient.nickname||i.recipient.name||"Your partner")+(i.status==="ACCEPTED"?" accepted your Watch Together invitation. They are watching with you now.":" declined your Watch Together invitation."),kind:i.status==="ACCEPTED"?"accepted":"declined"})),
   ...replies.map(i=>({id:"reply-"+i.id+"-"+i.customMessage,text:(i.recipient.nickname||i.recipient.name||"Your partner")+" replied: "+i.customMessage,kind:"reply"})),
   ...chatAfterLeave,
  ]
 })
}
