import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import type { Persona } from '../types'

const congratsVoice: Record<Persona, string> = {
  'drill-sergeant': "DISMISSED. You cooked it. Don't expect a medal.",
  nani: "Wah beta wah! I am so proud of you! Now go eat while it's hot!",
  'zen-master': 'The dish is complete. And so, for a moment, are you.',
  'hype-man': "YOOOO YOU JUST COOKED THAT WHOLE THING LET'S GOOOOO!",
}

export default function DoneScreen() {
  const navigate = useNavigate()
  const { selectedPersona, speak } = useAppContext()

  const message = selectedPersona ? congratsVoice[selectedPersona.id] : 'Amazing work in the kitchen.'

  useEffect(() => {
    if (!selectedPersona) {
      return
    }
    void speak(congratsVoice[selectedPersona.id], selectedPersona.voiceId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 text-center text-white">
      <p className="text-8xl">🎉</p>
      <h1 className="mt-6 text-5xl font-bold">You did it!</h1>
      <p className="mt-6 max-w-md text-xl text-gray-300">{message}</p>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/recipe')}
          className="rounded-full bg-orange-500 px-8 py-3 font-bold text-white transition hover:bg-orange-400"
        >
          Cook Again
        </button>
        <button
          type="button"
          onClick={() => navigate('/recipe')}
          className="rounded-full bg-orange-500 px-8 py-3 font-bold text-white transition hover:bg-orange-400"
        >
          New Recipe
        </button>
      </div>
    </main>
  )
}
