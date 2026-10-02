import PageHeader from "@/components/common/PageHeader"
import NotesClientPage from "@/components/notes/NotesClientPage"

export const dynamic = "force-dynamic"

export default function MyNotesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 px-2 py-4 text-white sm:px-4">
      <div className="mx-auto w-full max-w-7xl">
        <PageHeader title="📒 My Notes" backHref="/notes" />
        <NotesClientPage mode="personal" title="My Notes" />
      </div>
    </main>
  )
}
