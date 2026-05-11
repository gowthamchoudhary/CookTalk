import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERSONAS, useAppContext } from '../context/AppContext'
import { PersonaCard } from '../components/PersonaCard'
import type { Persona } from '../types'

const catchphrases: Record<string, string> = {
  'drill-sergeant': 'No excuses. We cook now.',
  nani: 'Aaram se beta, flavor first.',
  'zen-master': 'Each chop is a breath.',
  'hype-man': 'Kitchen championship starts now!',
}

const intros: Record<Persona, string> = {
  'drill-sergeant':
    'Listen up! I am your drill sergeant. We are cooking TODAY. No excuses!',
  nani: "Arey beta, don't worry. Nani is here. We will cook something wonderful together!",
  'zen-master': 'Still your mind. The kitchen is your temple. Let us begin the journey.',
  'hype-man': "YOOO let's GOOO! We are about to cook the most INCREDIBLE meal of your LIFE!",
}

export default function PersonaPicker() {
  const navigate = useNavigate()
  const { selectedPersona, setSelectedPersona, speak } = useAppContext()
  const [previewingId, setPreviewingId] = useState<Persona | null>(null)

  const handlePick = (id: Persona) => {
    const persona = PERSONAS.find((p) => p.id === id)
    if (!persona) return

    setSelectedPersona(persona)
    setPreviewingId(id)

    void (async () => {
      try {
        await speak(intros[id], persona.voiceId)
      } catch {
        /* preview optional */
      } finally {
        setPreviewingId(null)
      }
    })()
  }

  const showStart = Boolean(selectedPersona && !previewingId)

  return (
    <main className="min-h-screen bg-gray-950 px-6 pb-28 pt-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold">Pick your chef</h1>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PERSONAS.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={selectedPersona?.id === persona.id}
              onSelect={() => handlePick(persona.id)}
              catchphrase={catchphrases[persona.id]}
              isPreviewing={previewingId === persona.id}
            />
          ))}
        </div>
      </div>

      {showStart ? (
        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            onClick={() => navigate('/cook')}
            className="rounded-full bg-orange-500 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-orange-400"
          >
            Start Cooking
          </button>
        </div>
      ) : null}
    </main>
  )
}
