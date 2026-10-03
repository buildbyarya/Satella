import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (Object.prototype.hasOwnProperty.call(body, "image")) {
    return NextResponse.json({ error: "Profile pictures are upload-only. Use Account Settings to upload an image." }, { status: 400 })
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined
  if (nickname === undefined) return NextResponse.json({ error: "Nothing to update." }, { status: 400 })

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { nickname: nickname || null },
    select: { nickname: true, image: true },
  })

  return NextResponse.json(user)
}
