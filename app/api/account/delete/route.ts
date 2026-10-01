import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  // All User-owned records use Prisma cascade relations. Shared Home data is
  // intentionally preserved for the remaining partner; Home deletion is a
  // separate, mutual-confirmation flow.
  await prisma.user.delete({ where: { id: user.id } })

  return NextResponse.json({ ok: true })
}
