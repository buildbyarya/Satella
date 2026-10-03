import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import PageHeader from "@/components/common/PageHeader"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function PartnerProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) redirect("/login")

  const membership = await prisma.homeMember.findUnique({
    where: { userId: user.id },
    include: { home: { include: { members: { include: { user: true } } } } },
  })

  const partner = membership?.home.members.find(member => member.userId !== user.id)
  const partnerName = partner?.nickname || partner?.user.nickname || partner?.user.name || "Your partner"

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-6">
      <div className="mx-auto max-w-md">
        <PageHeader title="💜 Partner" backHref="/profile" />
        {!partner ? (
          <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center">
            <div className="text-5xl">💜</div>
            <h2 className="mt-4 text-xl font-bold">No partner connected</h2>
            <p className="mt-2 text-sm text-white/50">Your partner's profile will appear here once your Home has two members.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-white/10 p-6 text-center">
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-white/15 bg-white/10">
              {partner.user.image ? <img src={partner.user.image} alt={partnerName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-5xl">♡</div>}
            </div>
            <h2 className="mt-5 text-2xl font-bold">{partnerName}</h2>
            <p className="mt-1 text-sm text-white/50">Your partner</p>
          </div>
        )}
      </div>
    </main>
  )
}
