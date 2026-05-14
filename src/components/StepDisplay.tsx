interface StepDisplayProps {
  stepText: string
}

export function StepDisplay({ stepText }: StepDisplayProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[26px] font-bold leading-relaxed text-[#1a1a1a]">{stepText}</p>
    </div>
  )
}
