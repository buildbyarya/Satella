"use client"

import HomeButton from "./HomeButton"
import ActivityButton from "./ActivityButton"
import LettersButton from "./LettersButton"
import RoadmapButton from "./RoadmapButton"
import CalendarButton from "./CalendarButton"
import GamesButton from "./GamesButton"
import SettingsButton from "./SettingsButton"
import SupportButton from "./SupportButton"

export default function DrawerMenu() {
  return (
    <div className="flex flex-col gap-2">
      <HomeButton />
      <ActivityButton />
      <LettersButton />
      <RoadmapButton />
      <CalendarButton />
      <GamesButton />
      <SettingsButton />
      <SupportButton />
    </div>
  )
}
