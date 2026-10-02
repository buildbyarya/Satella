import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function context() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return null
  const membership = await prisma.homeMember.findUnique({
    where: { userId: user.id },
    include: { home: { include: { members: true } } },
  })
  return membership ? { user, membership } : null
}

function cleanHtml(value: unknown) {
  if (typeof value !== "string") return ""
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
}

async function sharedSetting(homeId: string) {
  return prisma.chatSetting.upsert({ where: { homeId }, create: { homeId }, update: {} })
}

async function preference(homeId: string, userId: string) {
  return prisma.chatPreference.upsert({ where: { userId }, create: { homeId, userId }, update: {} })
}

async function expireMedia(homeId: string) {
  await prisma.chatMessage.updateMany({
    where: { homeId, mediaExpiresAt: { lte: new Date() }, mediaData: { not: null } },
    data: { mediaData: null },
  })
}

async function payload(homeId: string, userId: string, partnerId: string | null) {
  await expireMedia(homeId)
  const messages = await prisma.chatMessage.findMany({
    where: { homeId }, orderBy: { createdAt: "asc" }, take: 300,
    include: {
      sender: { select: { id: true, nickname: true, name: true } },
      replyTo: { include: { sender: { select: { nickname: true, name: true } } } },
      views: { where: { userId }, select: { views: true } },
      reactions: { select: { userId: true, emoji: true } },
    },
  })
  const reads = await prisma.chatRead.findMany({
    where: { homeId, userId: { in: partnerId ? [userId, partnerId] : [userId] } },
  })
  const partnerReadAt = reads.find(r => r.userId === partnerId)?.lastReadAt ?? null
  const partnerRead = partnerReadAt?.getTime() ?? 0

  return messages.map(m => {
    const used = m.views[0]?.views ?? 0
    const reactionMap: Record<string, { count: number; mine: boolean }> = {}
    for (const r of m.reactions) {
      reactionMap[r.emoji] ??= { count: 0, mine: false }
      reactionMap[r.emoji].count++
      if (r.userId === userId) reactionMap[r.emoji].mine = true
    }
    const seenByPartner = m.senderId === userId && partnerRead >= m.createdAt.getTime()
    return {
      id: m.id, senderId: m.senderId,
      senderName: m.sender.nickname || m.sender.name || "User",
      content: m.content, kind: m.kind, pinned: m.pinned,
      editedAt: m.editedAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
      style: {
        fontSize: m.fontSize ?? 16, textColor: m.textColor ?? "#ffffff",
        fontFamily: m.fontFamily ?? "system-ui",
        bubbleColor: m.bubbleColor ?? (m.senderId === userId ? "#7c3aed" : "#27272a"),
      },
      replyTo: m.replyTo ? {
        id: m.replyTo.id,
        senderName: m.replyTo.sender.nickname || m.replyTo.sender.name || "User",
        content: m.replyTo.content, kind: m.replyTo.kind,
      } : null,
      media: m.kind !== "TEXT" ? {
        mime: m.mediaMime, remaining: Math.max(0, 3 - used),
        expiresAt: m.mediaExpiresAt?.toISOString() || null, available: Boolean(m.mediaData),
      } : null,
      reactions: reactionMap,
      seenByPartner,
      seenAt: seenByPartner ? partnerReadAt?.toISOString() || null : null,
    }
  })
}

export async function GET(request: Request) {
  const c = await context()
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const messages = await payload(c.membership.homeId, c.user.id, c.membership.home.members.find(m => m.userId !== c.user.id)?.userId ?? null)
  const [chatSetting, pref] = await Promise.all([sharedSetting(c.membership.homeId), preference(c.membership.homeId, c.user.id)])
  return NextResponse.json({
    userId: c.user.id, messages,
    setting: { background: chatSetting.background, backgroundImage: chatSetting.backgroundImage },
    preference: pref,
  })
}

export async function POST(request: Request) {
  const c = await context()
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const homeId = c.membership.homeId

  if (body.action === "read") {
    if (body.source !== "chat-bottom") return NextResponse.json({ ok: true, ignored: true })
    await prisma.chatRead.upsert({
      where: { homeId_userId: { homeId, userId: c.user.id } },
      create: { homeId, userId: c.user.id, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (body.action === "send") {
    const kind = ["IMAGE", "VOICE", "VIDEO"].includes(body.kind) ? body.kind : "TEXT"
    const content = kind === "TEXT" ? cleanHtml(body.content).trim() : String(body.content || "")
    if (!content) return NextResponse.json({ error: "Empty message" }, { status: 400 })
    if (content.length > (kind === "TEXT" ? 20000 : 6000000)) return NextResponse.json({ error: "Message is too large" }, { status: 413 })
    const replyToId = typeof body.replyToId === "string" ? body.replyToId : null
    if (replyToId && !(await prisma.chatMessage.findFirst({ where: { id: replyToId, homeId } }))) return NextResponse.json({ error: "Reply target not found" }, { status: 400 })
    const pref = await preference(homeId, c.user.id)
    const msg = await prisma.chatMessage.create({
      data: {
        homeId, senderId: c.user.id, content, kind, replyToId,
        fontSize: kind === "TEXT" ? pref.fontSize : null,
        textColor: kind === "TEXT" ? pref.textColor : null,
        fontFamily: kind === "TEXT" ? pref.fontFamily : null,
        bubbleColor: pref.bubbleColor,
        mediaData: kind === "TEXT" ? null : content,
        mediaMime: kind === "TEXT" ? null : String(body.mime || "application/octet-stream"),
        mediaExpiresAt: kind === "TEXT" ? null : new Date(Date.now() + 86400000),
      },
    })
    return NextResponse.json({ id: msg.id })
  }

  if (body.action === "edit") {
    const id = String(body.messageId || ""), content = cleanHtml(body.content).trim()
    const msg = await prisma.chatMessage.findFirst({ where: { id, homeId, senderId: c.user.id, kind: "TEXT" } })
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 })
    if (!content) return NextResponse.json({ error: "Empty message" }, { status: 400 })
    const updated = await prisma.chatMessage.update({ where: { id }, data: { content, editedAt: new Date() } })
    return NextResponse.json({ ok: true, editedAt: updated.editedAt })
  }

  if (body.action === "view-media") {
    const messageId = String(body.messageId || "")
    const msg = await prisma.chatMessage.findFirst({ where: { id: messageId, homeId } })
    if (!msg || msg.kind === "TEXT") return NextResponse.json({ error: "Media not found" }, { status: 404 })
    if (!msg.mediaData || (msg.mediaExpiresAt && msg.mediaExpiresAt <= new Date())) {
      if (msg.mediaData) await prisma.chatMessage.update({ where: { id: msg.id }, data: { mediaData: null } })
      return NextResponse.json({ dead: true, remaining: 0 })
    }
    const existing = await prisma.chatMediaView.findUnique({ where: { messageId_userId: { messageId, userId: c.user.id } } })
    if ((existing?.views ?? 0) >= 3) return NextResponse.json({ dead: true, remaining: 0 })
    const recentlyOpened = existing && Date.now() - existing.updatedAt.getTime() < 1200
    const view = recentlyOpened ? existing : await prisma.chatMediaView.upsert({
      where: { messageId_userId: { messageId, userId: c.user.id } },
      create: { messageId, userId: c.user.id, views: 1 }, update: { views: { increment: 1 } },
    })
    const remaining = Math.max(0, 3 - view.views)
    const members = await prisma.homeMember.findMany({ where: { homeId }, select: { userId: true } })
    const memberIds = members.map(m => m.userId)
    const allViews = await prisma.chatMediaView.findMany({ where: { messageId }, select: { userId: true, views: true } })
    if (memberIds.length > 0 && memberIds.every(id => (allViews.find(v => v.userId === id)?.views ?? 0) >= 3)) {
      await prisma.chatMessage.update({ where: { id: messageId }, data: { mediaData: null } })
    }
    return NextResponse.json({ dead: false, remaining, data: msg.mediaData, mime: msg.mediaMime, download: body.download === true })
  }

  if (body.action === "pin") {
    const id = String(body.messageId || ""), msg = await prisma.chatMessage.findFirst({ where: { id, homeId } })
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 })
    const updated = await prisma.chatMessage.update({ where: { id }, data: { pinned: !msg.pinned } })
    return NextResponse.json({ pinned: updated.pinned })
  }

  if (body.action === "react") {
    const id = String(body.messageId || ""), emoji = String(body.emoji || "").slice(0, 8)
    const msg = await prisma.chatMessage.findFirst({ where: { id, homeId } })
    if (!msg || !emoji) return NextResponse.json({ error: "Message not found" }, { status: 404 })
    const existing = await prisma.chatReaction.findUnique({ where: { messageId_userId_emoji: { messageId: id, userId: c.user.id, emoji } } })
    if (existing) await prisma.chatReaction.delete({ where: { id: existing.id } })
    else await prisma.chatReaction.create({ data: { messageId: id, userId: c.user.id, emoji } })
    return NextResponse.json({ ok: true })
  }

  if (body.action === "delete") {
    const id = String(body.messageId || ""), msg = await prisma.chatMessage.findFirst({ where: { id, homeId, senderId: c.user.id } })
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 })
    await prisma.chatMessage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }

  if (body.action === "shared-settings") {
    const backgroundImage = typeof body.backgroundImage === "string" ? body.backgroundImage.slice(0, 6000000) : null
    const updated = await prisma.chatSetting.upsert({ where: { homeId }, create: { homeId, backgroundImage }, update: { backgroundImage } })
    return NextResponse.json({ setting: updated })
  }

  if (body.action === "style") {
    const updated = await prisma.chatPreference.update({
      where: { userId: c.user.id },
      data: {
        fontSize: Math.min(28, Math.max(11, Number(body.fontSize) || 16)),
        textColor: typeof body.textColor === "string" ? body.textColor.slice(0, 32) : "#ffffff",
        fontFamily: typeof body.fontFamily === "string" ? body.fontFamily.slice(0, 80) : "system-ui",
        bubbleColor: typeof body.bubbleColor === "string" ? body.bubbleColor.slice(0, 32) : "#7c3aed",
      },
    })
    return NextResponse.json({ preference: updated })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
