import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import PageHeader from "@/components/common/PageHeader"
import ProfileActions from "@/components/profile/ProfileActions"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect("/login")

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-6">
      <div className="mx-auto max-w-md">
        <PageHeader title="👤 Profile" backHref="/home" />
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white/10 p-6 text-center">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-white/10">
              {user.image ? <img src={user.image} alt="Profile" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">♡</div>}
            </div>
            <h2 className="mt-4 text-2xl font-bold">{user.nickname || user.name || "Your profile"}</h2>
            <p className="mt-1 text-sm text-white/50">{user.email}</p>
          </div>
          <ProfileActions nickname={user.nickname || ""} image={user.image || ""} />
          <Link href="/account-settings" className="block rounded-2xl bg-white/10 p-5 transition hover:bg-white/20 active:scale-95">
            ⚙ Account Settings
          </Link>
        </div>
      </div>
    </main>
  )
}
