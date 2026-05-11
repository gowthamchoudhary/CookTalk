interface StepDisplayProps {
  stepText: string
}

export function StepDisplay({ stepText }: StepDisplayProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 text-center">
      <p className="text-4xl font-bold leading-relaxed text-white">{stepText}</p>
    </div>
  )
}
