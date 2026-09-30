import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const membership = await prisma.homeMember.findUnique({ where: { userId: user.id } })
  if (!membership) return NextResponse.json({ error: "No home" }, { status: 404 })
  const partner = await prisma.homeMember.findFirst({ where: { homeId: membership.homeId, userId: { not: user.id } } })
  if (!partner) return NextResponse.json({ userId: user.id, seenAt: null })
  const read = await prisma.chatRead.findUnique({ where: { homeId_userId: { homeId: membership.homeId, userId: partner.userId } } })
  return NextResponse.json({ userId: user.id, seenAt: read?.lastReadAt?.toISOString() || null })
}
