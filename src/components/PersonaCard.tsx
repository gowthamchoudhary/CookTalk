import type { PersonaConfig } from '../types'

interface PersonaCardProps {
  persona: PersonaConfig
  isSelected: boolean
  onSelect: () => void
  isPreviewing?: boolean
}

const cardStyles: Record<PersonaConfig['id'], { background: string; border: string; circle: string }> = {
  'drill-sergeant': {
    background: 'linear-gradient(135deg, #fff5f5, #ffe4e4)',
    border: '#c0392b',
    circle: '#ffe4e4',
  },
  nani: {
    background: 'linear-gradient(135deg, #f0fff4, #dcfce7)',
    border: '#16a34a',
    circle: '#bbf7d0',
  },
  'zen-master': {
    background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)',
    border: '#2563eb',
    circle: '#bfdbfe',
  },
  'hype-man': {
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '#d97706',
    circle: '#fde68a',
  },
}

export function PersonaCard({ persona, isSelected, onSelect, isPreviewing }: PersonaCardProps) {
  const style = cardStyles[persona.id]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-h-[230px] rounded-3xl border-2 p-6 text-center shadow-sm transition-all active:scale-[0.98] ${
        isSelected ? '' : 'border-transparent'
      }`}
      style={{ background: style.background, borderColor: isSelected ? style.border : 'transparent' }}
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl" style={{ backgroundColor: style.circle }}>
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
}
