import Link from "next/link"

export default function GamesButton() {
  return (
    <Link
      href="/games"
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      <span className="text-xl">🎮</span>
      <span>Games</span>
    </Link>
  )
}
