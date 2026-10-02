"use client"

export default function SupportPage(){
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-pink-950 p-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <a href="/account-settings" className="rounded-xl bg-white/10 px-3 py-2" aria-label="Back">←</a>
          <h1 className="text-lg font-bold">Satella Support</h1>
          <div className="w-10" />
        </div>
        <section className="mt-6 rounded-3xl bg-white/10 p-6">
          <h2 className="text-xl font-bold">Need help leaving a Home?</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Home deletion is protected so one partner cannot erase the shared Home or the other partner’s account alone.
            If your partner is unavailable, the requester can use the 3-day no-response route. If something is preventing that process from working,
            contact the Satella project support channel below.
          </p>
          <a
            href="https://github.com/buildbyarya/Satella/issues"
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-xl bg-pink-500/25 px-4 py-3 text-center font-semibold"
          >
            Open Satella Support
          </a>
          <p className="mt-4 text-xs leading-5 text-white/40">
            Do not post passwords, OAuth tokens, database credentials, or other private account information in a support request.
          </p>
        </section>
      </div>
    </main>
  )
}
