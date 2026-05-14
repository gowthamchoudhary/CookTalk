import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import type { Persona } from '../types'

const congratsVoice: Record<Persona, string> = {
  'drill-sergeant': "DISMISSED. You cooked it. Don't expect a medal.",
  nani: "Wah beta wah! I am so proud of you! Now go eat while it's hot!",
  'zen-master': 'The dish is complete. And so, for a moment, are you.',
  'hype-man': "YOOOO YOU JUST COOKED THAT WHOLE THING LET'S GOOOOO!",
}

const confettiColors = ['#2d4a1e', '#16a34a', '#2563eb', '#d97706', '#c0392b', '#7c6a3e']

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  if (mins <= 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

export default function DoneScreen() {
  const navigate = useNavigate()
  const { recipe, selectedPersona, speak, cookStartedAt, setCookStartedAt } = useAppContext()
  const [copied, setCopied] = useState(false)
  const totalSeconds = useMemo(() => Math.round((Date.now() - (cookStartedAt ?? Date.now())) / 1000), [cookStartedAt])

  const message = selectedPersona ? congratsVoice[selectedPersona.id] : 'Amazing work in the kitchen.'
  const recipeTitle = recipe?.title ?? 'a recipe'

  useEffect(() => {
    if (!selectedPersona) return
    void speak(congratsVoice[selectedPersona.id], selectedPersona.voiceId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const share = async () => {
    await navigator.clipboard.writeText(`I just cooked ${recipe?.title} completely hands-free with VoiceChef! 🎙👨‍🍳`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#f5f0e8] to-[#e8f5e0] px-6 text-center font-sans text-[#1a1a1a]">
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="animate-confetti absolute block h-3 w-3 rounded-full"
            style={{
              left: `${8 + ((index * 23) % 84)}%`,
              top: `-${(index % 4) * 12}px`,
              background: confettiColors[index % confettiColors.length],
              animationDelay: `${(index % 6) * 0.25}s`,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 flex flex-col items-center">
        <p className="text-8xl">{selectedPersona?.emoji ?? '🍽'}</p>
        <h1 className="mt-7 text-4xl font-bold tracking-tight text-[#1a1a1a]">You nailed it.</h1>
        <p className="mt-3 max-w-sm text-xl font-bold text-[#2d4a1e]">{recipeTitle}</p>
        <p className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2d4a1e] shadow-sm">
          Total time cooked: {formatDuration(totalSeconds)}
        </p>
        <p className="mt-5 max-w-xs text-center text-sm italic text-[#666]">&ldquo;{message}&rdquo;</p>
      </section>

      <div className="relative z-10 mt-12 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => void share()}
          className="rounded-2xl border border-[#2d4a1e] bg-transparent py-5 font-semibold text-[#2d4a1e]"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => {
            setCookStartedAt(null)
            navigate('/recipe')
          }}
          className="rounded-2xl bg-[#2d4a1e] py-5 font-semibold text-white"
        >
          Cook Again
        </button>
        <button
          type="button"
          onClick={() => {
            setCookStartedAt(null)
            navigate('/recipe')
          }}
          className="rounded-2xl bg-white py-5 font-semibold text-[#2d4a1e] shadow-sm"
        >
          Try New Recipe
        </button>
      </div>

      {copied ? (
        <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2d4a1e] px-5 py-3 text-sm font-bold text-white shadow-sm">
          Copied!
        </div>
      ) : null}
    </main>
  )
}
