import PhaseTwoGame from "@/components/games/PhaseTwoGame"
export default async function Page({params}:{params:Promise<{game:string}>}){return <PhaseTwoGame game={(await params).game}/>}
