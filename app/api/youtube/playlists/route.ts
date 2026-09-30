import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserHome } from "@/lib/home"

async function context() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return null
  const home = await getUserHome(user.id)
  const member = home ? await prisma.homeMember.findUnique({ where: { userId: user.id } }) : null
  return home && member ? { user, home, member } : null
}

async function ensurePlaylists(homeId: string, memberId: string) {
  const [personal, common] = await Promise.all([
    prisma.playlist.upsert({
      where: { id: `personal-${memberId}` },
      create: { id: `personal-${memberId}`, name: "Personal Playlist", type: "CUSTOM", visibility: "PERSONAL", homeMemberId: memberId },
      update: { name: "Personal Playlist", visibility: "PERSONAL", homeMemberId: memberId },
      include: { videos: { orderBy: { addedAt: "desc" } } },
    }),
    prisma.playlist.upsert({
      where: { id: `common-${homeId}` },
      create: { id: `common-${homeId}`, name: "Common Playlist", type: "CUSTOM", visibility: "SHARED", homeId },
      update: { name: "Common Playlist", visibility: "SHARED", homeId },
      include: { videos: { orderBy: { addedAt: "desc" } } },
    }),
  ])
  return { personal, common }
}

export async function GET() {
  const c = await context()
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { personal, common } = await ensurePlaylists(c.home.id, c.member.id)
  return NextResponse.json({
    personal: { id: personal.id, name: personal.name, videos: personal.videos.map(v => v.youtubeVideoId) },
    common: { id: common.id, name: common.name, videos: common.videos.map(v => v.youtubeVideoId) },
  })
}

export async function POST(request: Request) {
  const c = await context()
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const videoId = String(body?.videoId || "").trim()
  const playlistId = String(body?.playlistId || "").trim()
  if (!videoId || !playlistId) return NextResponse.json({ error: "Missing video or playlist." }, { status: 400 })

  const { personal, common } = await ensurePlaylists(c.home.id, c.member.id)
  const playlist = playlistId === personal.id ? personal : playlistId === common.id ? common : null
  if (!playlist) return NextResponse.json({ error: "Playlist not found." }, { status: 404 })

  const video = await prisma.playlistVideo.upsert({
    where: { playlistId_youtubeVideoId: { playlistId: playlist.id, youtubeVideoId: videoId } },
    create: { playlistId: playlist.id, youtubeVideoId: videoId },
    update: {},
  })
  return NextResponse.json({ ok: true, playlistId: playlist.id, videoId: video.youtubeVideoId })
}
