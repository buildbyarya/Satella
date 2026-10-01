import PhaseOneGame from "@/components/games/PhaseOneGame"
export default async function Page({params}:{params:Promise<{game:string}>}){return <PhaseOneGame params={await params}/>} 
