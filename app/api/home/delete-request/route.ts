import {getServerSession} from "next-auth"
import {NextResponse} from "next/server"
import {authOptions} from "@/lib/auth"
import {prisma} from "@/lib/prisma"

const THREE_DAYS=3*24*60*60*1000

async function currentUser(){
 const session=await getServerSession(authOptions)
 if(!session?.user?.email)return null
 return prisma.user.findUnique({where:{email:session.user.email}})
}

async function membership(userId:string){
 return prisma.homeMember.findUnique({where:{userId},include:{home:{include:{members:{include:{user:true}}}}}})
}

function noResponseForThreeDays(request:any){
 return Date.now()-request.createdAt.getTime()>=THREE_DAYS
}

export async function GET(){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
 const member=await membership(user.id)
 if(!member)return NextResponse.json({hasHome:false,request:null})
 const partner=member.home.members.find(m=>m.userId!==user.id)
 const request=await prisma.homeDeletionRequest.findUnique({where:{homeId:member.homeId},include:{requester:true,partner:true}})
 if(!request)return NextResponse.json({hasHome:true,homeId:member.homeId,partner:partner?{id:partner.userId,nickname:partner.nickname||partner.user.nickname||partner.user.name}:null,request:null})
 const other=request.requesterId===user.id?request.partner:request.requester
 return NextResponse.json({
  hasHome:true,
  homeId:member.homeId,
  partner:partner?{id:partner.userId,nickname:partner.nickname||partner.user.nickname||partner.user.name}:null,
  request:{
   id:request.id,
   role:request.requesterId===user.id?"requester":"partner",
   decision:request.partnerDecision,
   createdAt:request.createdAt.toISOString(),
   respondedAt:request.respondedAt?.toISOString()||null,
   noResponseForThreeDays:request.requesterId===user.id&&request.partnerDecision==="PENDING"&&noResponseForThreeDays(request),
   partnerLastUpdatedAt:other.updatedAt.toISOString()
  }
 })
}

export async function POST(req:Request){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
 const body=await req.json().catch(()=>({}))
 const member=await membership(user.id)
 if(!member)return NextResponse.json({error:"You are not in a Home."},{status:400})
 const members=member.home.members
 if(members.length!==2)return NextResponse.json({error:"Home deletion requires exactly two members."},{status:400})
 const partner=members.find(m=>m.userId!==user.id)
 if(!partner)return NextResponse.json({error:"Partner not found."},{status:400})

 if(body.action==="request"){
  const existing=await prisma.homeDeletionRequest.findUnique({where:{homeId:member.homeId}})
  if(existing){
   return NextResponse.json({
    requestId:existing.id,
    existing:true,
    decision:existing.partnerDecision,
   })
  }
  const created=await prisma.homeDeletionRequest.create({data:{homeId:member.homeId,requesterId:user.id,partnerId:partner.userId}})
  return NextResponse.json({ok:true,requestId:created.id})
 }

 const requestId=String(body.requestId||"")
 const deletion=await prisma.homeDeletionRequest.findFirst({where:{id:requestId,homeId:member.homeId},include:{requester:true,partner:true}})
 if(!deletion)return NextResponse.json({error:"Deletion request not found."},{status:404})

 if(body.action==="respond"){
  if(deletion.partnerId!==user.id)return NextResponse.json({error:"Only the invited partner can answer this request."},{status:403})
  const decision=String(body.decision||"").toUpperCase()
  if(!["YES","NO"].includes(decision))return NextResponse.json({error:"Invalid decision."},{status:400})
  await prisma.homeDeletionRequest.update({where:{id:deletion.id},data:{partnerDecision:decision,respondedAt:new Date()}})
  return NextResponse.json({ok:true,decision})
 }

 if(body.action==="final-confirm"){
  const isPartner=deletion.partnerId===user.id
  const isRequester=deletion.requesterId===user.id
  const requesterEligible=isRequester&&deletion.partnerDecision==="PENDING"&&noResponseForThreeDays(deletion)
  const partnerEligible=isPartner&&deletion.partnerDecision==="YES"
  if(!requesterEligible&&!partnerEligible)return NextResponse.json({error:"This Home cannot be deleted yet. Your partner must agree, or you must wait three days without a response."},{status:403})

  const userIds=[deletion.requesterId,deletion.partnerId]
  await prisma.$transaction(async tx=>{
   await tx.home.delete({where:{id:deletion.homeId}})
   await tx.user.deleteMany({where:{id:{in:userIds}}})
  })
  return NextResponse.json({ok:true,deleted:true})
 }

 return NextResponse.json({error:"Unknown action."},{status:400})
}
