import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ unreadCount: 0 }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ unreadCount: 0 }, { status: 401 })

  const membership = await prisma.homeMember.findUnique({ where: { userId: user.id } })
  if (!membership) return NextResponse.json({ unreadCount: 0 })

  const partner = await prisma.homeMember.findFirst({
    where: { homeId: membership.homeId, userId: { not: user.id } },
    select: { userId: true },
  })
  if (!partner) return NextResponse.json({ unreadCount: 0 })

  const read = await prisma.chatRead.findUnique({ where: { homeId_userId: { homeId: membership.homeId, userId: user.id } } })
  const lastReadAt = read?.lastReadAt ?? new Date(0)
  const unread = await prisma.chatMessage.findMany({
    where: { homeId: membership.homeId, senderId: partner.userId, createdAt: { gt: lastReadAt } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({
    unreadCount: unread.length,
    latestUnreadId: unread[0]?.id ?? null,
  })
}
