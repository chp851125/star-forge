import { useState } from 'react'
import type { GameMode } from './types'
import ModeSelect from './components/screens/ModeSelect'
import MainScreen from './components/screens/MainScreen'
import { QualityProvider } from './components/Sword/quality'
import { useButtonSounds } from './audio/useButtonSounds'

type Screen =
  | { name: 'mode' }
  | { name: 'main'; mode: GameMode; run: number }

export default function App() {
  useButtonSounds()
  return (
    <QualityProvider>
      <Screens />
    </QualityProvider>
  )
}

function Screens() {
  const [screen, setScreen] = useState<Screen>({ name: 'mode' })
  const restart = () => setScreen({ name: 'mode' })

  if (screen.name === 'mode') {
    return <ModeSelect onStart={(mode) => setScreen({ name: 'main', mode, run: Date.now() })} />
  }
  // 結算畫面由 MainScreen 依結算快照顯示
  return <MainScreen key={screen.run} mode={screen.mode} onRestart={restart} />
}
