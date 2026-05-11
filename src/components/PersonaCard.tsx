import type { PersonaConfig } from '../types'

interface PersonaCardProps {
  persona: PersonaConfig
  isSelected: boolean
  onSelect: () => void
  catchphrase?: string
  isPreviewing?: boolean
}

export function PersonaCard({ persona, isSelected, onSelect, catchphrase, isPreviewing }: PersonaCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-3xl border-2 bg-gray-900 p-6 text-left transition-all hover:border-orange-500 ${
        isSelected ? 'border-orange-500' : 'border-transparent'
      }`}
    >
      <div className="text-5xl">{persona.emoji}</div>
      <h3 className="mt-4 text-xl font-bold text-white">{persona.name}</h3>
      <p className="mt-2 text-sm text-gray-400">{persona.vibe}</p>
      {catchphrase ? <p className="mt-3 text-sm italic text-orange-300">&ldquo;{catchphrase}&rdquo;</p> : null}
      {isPreviewing ? <p className="mt-3 text-sm text-emerald-300">Previewing...</p> : null}
    </button>
  )
}
