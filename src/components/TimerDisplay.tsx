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
  return (
    <div className={`text-right font-mono font-bold text-[#2d4a1e] ${flashWarn ? 'animate-pulse' : ''}`}>
      {formatSeconds(seconds)}
    </div>
  )
}
