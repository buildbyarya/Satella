import PageHeader from "@/components/common/PageHeader"
import GamesHub from "@/components/games/GamesHub"

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="🎮 Games" backHref="/home" />
        <div className="mt-4"><GamesHub /></div>
      </div>
    </main>
  )
}
