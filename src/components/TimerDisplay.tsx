interface TimerDisplayProps {
  seconds: number
  flashWarn?: boolean
}

function formatSeconds(seconds: number) {
  const safeValue = Math.max(seconds, 0)
  const mins = Math.floor(safeValue / 60)
  const secs = safeValue % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function TimerDisplay({ seconds, flashWarn }: TimerDisplayProps) {
  const isDanger = seconds > 0 && seconds < 60
  const isWarnFlash = Boolean(flashWarn)
  return (
    <div
      className={`text-2xl font-mono text-orange-400 transition-colors duration-300 ${
        isWarnFlash || isDanger ? 'text-red-400' : ''
      } ${isWarnFlash ? 'animate-pulse' : ''}`}
    >
      {formatSeconds(seconds)}
    </div>
  )
}
