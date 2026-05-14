export type VoiceOrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceOrbProps {
  state: VoiceOrbState
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'h-16 w-16 text-2xl',
  md: 'h-20 w-20 text-3xl',
  lg: 'h-[88px] w-[88px] text-3xl',
}

const stateClasses: Record<VoiceOrbState, string> = {
  idle: 'bg-[#2d4a1e]',
  listening: 'bg-red-500',
  thinking: 'bg-[#2d4a1e]',
  speaking: 'bg-blue-500',
}

export function VoiceOrb({ state, onClick, size = 'md', disabled }: VoiceOrbProps) {
  const isActive = state === 'listening' || state === 'speaking'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-full font-bold text-white disabled:opacity-50 ${stateClasses[state]} ${sizeClasses[size]}`}
      aria-label="Voice control"
    >
      {isActive ? <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" /> : null}
      {state === 'thinking' ? (
        <span className="absolute inset-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : null}
      <span className="relative z-10">🎙</span>
    </button>
  )
}
