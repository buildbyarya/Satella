import { getServerSession } from "next-auth"
import PageHeader from "@/components/common/PageHeader"
import NotesClientPage from "@/components/notes/NotesClientPage"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function OtherNotesPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user?.email ? await prisma.user.findUnique({ where: { email: session.user.email } }) : null
  const membership = user
    ? await prisma.homeMember.findUnique({
        where: { userId: user.id },
        include: { home: { include: { members: { include: { user: true } } } } },
      })
    : null
  const other = membership?.home.members.find((member) => member.userId !== user?.id)
  const nickname = other?.user.nickname || other?.nickname || other?.user.name || "Other user's"

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 px-2 py-4 text-white sm:px-4">
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader title={`📒 ${nickname} Notes`} backHref="/notes" />
        <NotesClientPage mode="other" title={`${nickname}'s Notes`} />
      </div>
    </main>
  )
}
