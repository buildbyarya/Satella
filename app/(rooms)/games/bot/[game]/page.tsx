import BotGame from "@/components/games/BotGame"

export default async function Page({params}:{params:Promise<{game:string}>}) {
  return <BotGame game={(await params).game} />
}
