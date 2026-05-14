import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERSONAS, useAppContext } from '../context/AppContext'
import { stopCurrentAudio } from '../services/elevenlabs'
import type { Persona } from '../types'

const intros: Record<Persona, string> = {
  'drill-sergeant': 'Listen up! I am your drill sergeant. We are cooking TODAY. No excuses!',
  nani: "Arey beta, don't worry. Nani is here. We will cook something wonderful together!",
  'zen-master': 'Still your mind. The kitchen is your temple. Let us begin the journey.',
  'hype-man': "YOOO let's GOOO! We are about to cook the most INCREDIBLE meal of your LIFE!",
}

const cardStyles: Record<Persona, { background: string; selectedBorder: string; circle: string }> = {
  'drill-sergeant': {
    background: 'linear-gradient(135deg, #fff5f5, #ffe4e4)',
    selectedBorder: '#c0392b',
    circle: '#ffe4e4',
  },
  nani: {
    background: 'linear-gradient(135deg, #f0fff4, #dcfce7)',
    selectedBorder: '#16a34a',
    circle: '#bbf7d0',
  },
  'zen-master': {
    background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)',
    selectedBorder: '#2563eb',
    circle: '#bfdbfe',
  },
  'hype-man': {
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    selectedBorder: '#d97706',
    circle: '#fde68a',
  },
}

export default function PersonaPicker() {
  const navigate = useNavigate()
  const { selectedPersona, setSelectedPersona, speak } = useAppContext()
  const [previewingId, setPreviewingId] = useState<Persona | null>(null)
  const previewAbortRef = useRef<boolean>(false)
  const previewRunRef = useRef(0)

  const handlePick = (id: Persona) => {
    const persona = PERSONAS.find((p) => p.id === id)
    if (!persona) return

    previewAbortRef.current = true
    stopCurrentAudio()

    const runId = previewRunRef.current + 1
    previewRunRef.current = runId
    previewAbortRef.current = false

    setSelectedPersona(persona)
    setPreviewingId(id)

    void (async () => {
      try {
        await speak(intros[id], persona.voiceId)
      } catch {
        /* preview is optional */
      } finally {
        if (!previewAbortRef.current && previewRunRef.current === runId) {
          setPreviewingId(null)
        }
      }
    })()
  }

  const showStart = Boolean(selectedPersona && !previewingId)

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-5 pb-28 pt-6 font-sans text-[#1a1a1a]">
      <button type="button" onClick={() => navigate('/preview')} className="text-sm font-bold text-[#2d4a1e]">
        ← Back
      </button>

      <section className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Pick your chef</h1>
        <p className="mt-2 text-sm text-[#888]">Tap a card to preview the voice and wake word.</p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4">
        {PERSONAS.map((persona) => {
          const style = cardStyles[persona.id]
          const isSelected = selectedPersona?.id === persona.id
          const isPreviewing = previewingId === persona.id

          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => handlePick(persona.id)}
              className={`min-h-[230px] rounded-3xl border-2 p-6 text-center shadow-sm transition-all active:scale-[0.98] ${
                isSelected ? '' : 'border-transparent'
              }`}
              style={{ background: style.background, borderColor: isSelected ? style.selectedBorder : 'transparent' }}
            >
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl"
                style={{ backgroundColor: style.circle }}
              >
                {persona.emoji}
              </div>
              {isPreviewing ? (
                <div className="mt-4 flex h-8 items-end justify-center gap-1.5">
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className="animate-sound-bar block w-2 rounded-full bg-[#2d4a1e]"
                      style={{ animationDelay: `${bar * 0.12}s` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 h-8" />
              )}
              <h3 className="mt-4 text-base font-bold text-[#1a1a1a]">{persona.name}</h3>
              <p className="mt-2 min-h-[32px] text-xs leading-relaxed text-[#666]">{persona.vibe}</p>
              <p className={`mt-4 text-xs ${isSelected ? 'font-bold text-[#2d4a1e]' : 'text-[#888]'}`}>
                {isPreviewing ? 'Previewing...' : isSelected ? 'Selected' : `Say "${persona.wakeWord}"`}
              </p>
            </button>
          )
        })}
      </section>

      {showStart ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#f5f0e8]/95 px-5 pb-5 pt-4 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/cook')}
            className="w-full rounded-2xl bg-[#2d4a1e] py-5 text-lg font-bold text-white"
          >
            Let's Cook →
          </button>
        </div>
      ) : null}
    </main>
  )
}
