import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(){
  const session=await getServerSession(authOptions)
  if(!session?.user?.email)return NextResponse.json({error:"Unauthorized"},{status:401})
  const user=await prisma.user.findUnique({where:{email:session.user.email},select:{id:true,image:true,nickname:true,name:true,email:true}})
  if(!user)return NextResponse.json({error:"User not found"},{status:404})
  return NextResponse.json({user})
}

export async function POST(req:Request){
  const session=await getServerSession(authOptions)
  if(!session?.user?.email)return NextResponse.json({error:"Unauthorized"},{status:401})
  const body=await req.json()
  const image=typeof body.image==="string"?body.image:""
  if(!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(image))return NextResponse.json({error:"Please upload a PNG, JPG, WEBP or GIF image."},{status:400})
  if(image.length>4_500_000)return NextResponse.json({error:"Profile picture is too large. Keep it under about 3.3 MB."},{status:413})
  const user=await prisma.user.update({where:{email:session.user.email},data:{image},select:{id:true,image:true,nickname:true,name:true,email:true}})
  return NextResponse.json({user})
}

export async function DELETE(){
  const session=await getServerSession(authOptions)
  const email=session?.user?.email
  if(!email)return NextResponse.json({error:"Unauthorized"},{status:401})
  const user=await prisma.user.findUnique({where:{email},select:{id:true}})
  if(!user)return NextResponse.json({error:"Account not found"},{status:404})
  const membership=await prisma.homeMember.findUnique({where:{userId:user.id}})
  if(membership)return NextResponse.json({error:"This account belongs to a Home. Use Delete Home & Account so both members must approve the permanent deletion."},{status:409})
  await prisma.user.delete({where:{id:user.id}})
  return NextResponse.json({ok:true})
}
