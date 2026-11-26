import { useState } from 'react'
import type { GameMode, RunStats, Weapon } from './types'
import ModeSelect from './components/screens/ModeSelect'
import MainScreen from './components/screens/MainScreen'
import ResultScreen from './components/screens/ResultScreen'
import { QualityProvider } from './components/Sword/quality'

type Screen =
  | { name: 'mode' }
  | { name: 'main'; mode: GameMode; run: number }
  | { name: 'result'; mode: GameMode; weapon: Weapon; stats: RunStats }

export default function App() {
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
  if (screen.name === 'main') {
    const { mode } = screen
    return (
      <MainScreen
        key={screen.run}
        mode={mode}
        onRestart={restart}
        onFinish={(weapon, stats) => setScreen({ name: 'result', mode, weapon, stats })}
      />
    )
  }
  return <ResultScreen mode={screen.mode} weapon={screen.weapon} stats={screen.stats} onRestart={restart} />
}
