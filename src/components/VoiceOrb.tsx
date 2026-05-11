export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceOrbProps {
  state: VoiceOrbState
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'h-20 w-20 min-h-[80px] min-w-[80px] text-3xl',
  md: 'h-24 w-24 min-h-[96px] min-w-[96px] text-4xl',
  lg: 'h-28 w-28 min-h-[112px] min-w-[112px] text-5xl',
}

const stateClasses: Record<VoiceOrbState, string> = {
  idle: 'bg-orange-500 hover:bg-orange-400',
  listening: 'bg-red-500 animate-pulse',
  thinking: 'bg-orange-600',
  speaking: 'bg-blue-500',
}

export function VoiceOrb({ state, onClick, size = 'md', disabled }: VoiceOrbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-full text-white shadow-lg transition-transform disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${stateClasses[state]}`}
      aria-label="Voice control"
    >
      {state === 'thinking' && (
        <span className="absolute inset-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      )}
      <span className="relative z-10">{state === 'thinking' ? '' : '🎙️'}</span>
    </button>
  )
}
