import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepDisplay } from '../components/StepDisplay'
import { TimerDisplay } from '../components/TimerDisplay'
import { VoiceOrb, type VoiceOrbState } from '../components/VoiceOrb'
import { useAppContext } from '../context/AppContext'
import type { Persona } from '../types'
import { beginHoldRecording, type HoldRecorder } from '../services/elevenlabs'
import { answerCookingQuestion, parseVoiceIntent } from '../services/groq'

const almostThereLine: Record<Persona, string> = {
  'drill-sergeant': 'Almost there, soldier! One last push!',
  nani: 'Beta, almost there — finish with love!',
  'zen-master': 'The final movement approaches. Stay present.',
  'hype-man': 'ALMOST THERE — BRING IT HOME!',
}

export default function CookMode() {
  const navigate = useNavigate()
  const {
    recipe,
    currentStepIndex,
    setCurrentStepIndex,
    selectedPersona,
    isSpeaking,
    speak,
    lastCommand,
    setLastCommand,
    timerSeconds,
    setTimerSeconds,
    timerRunning,
    setTimerRunning,
  } = useAppContext()

  const [isHolding, setIsHolding] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [intentLabel, setIntentLabel] = useState('')
  const [timerFlash, setTimerFlash] = useState(false)

  const holdRef = useRef<HoldRecorder | null>(null)
  const holdingActiveRef = useRef(false)
  const startHoldLockRef = useRef(false)
  const oneMinWarnedRef = useRef(false)

  const currentStep = recipe?.steps[currentStepIndex]
  const totalSteps = recipe?.steps.length ?? 1
  const fallbackInstruction = 'Welcome to cook mode. Hold the mic and give a command.'

  const voiceId = selectedPersona?.voiceId ?? ''

  useEffect(() => {
    if (!recipe || !currentStep?.instruction) return

    let cancelled = false
    void (async () => {
      if (totalSteps > 1 && currentStepIndex === totalSteps - 1 && selectedPersona) {
        const line = almostThereLine[selectedPersona.id] ?? 'Almost there!'
        await speak(line, voiceId)
        if (cancelled) return
      }
      await speak(currentStep.instruction, voiceId)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- step navigation only
  }, [currentStepIndex])

  useEffect(() => {
    if (!timerRunning) {
      return
    }
    if (timerSeconds <= 0) {
      setTimerRunning(false)
      void speak("Timer's up!", voiceId).catch(() => {})
      return
    }

    const timer = setTimeout(() => {
      setTimerSeconds(timerSeconds - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timerRunning, timerSeconds, setTimerSeconds, setTimerRunning, speak, voiceId])

  useEffect(() => {
    if (!timerRunning) {
      oneMinWarnedRef.current = false
      return
    }
    if (timerSeconds === 60 && !oneMinWarnedRef.current) {
      oneMinWarnedRef.current = true
      setTimerFlash(true)
      window.setTimeout(() => setTimerFlash(false), 2500)
      void speak('One minute left!', voiceId).catch(() => {})
    }
    if (timerSeconds > 60) {
      oneMinWarnedRef.current = false
    }
  }, [timerSeconds, timerRunning, speak, voiceId])

  useEffect(() => {
    if (!intentLabel) {
      return
    }
    const timeout = window.setTimeout(() => setIntentLabel(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [intentLabel])

  const finishHold = async () => {
    if (!holdingActiveRef.current || !holdRef.current) {
      return
    }
    holdingActiveRef.current = false
    setIsHolding(false)

    const recorder = holdRef.current
    holdRef.current = null

    setIsProcessingVoice(true)
    try {
      const transcript = (await recorder.stop()).trim()

      if (!recipe || !currentStep) {
        return
      }

      setLastCommand(transcript || '(empty)')
      const intent = (await parseVoiceIntent(transcript, recipe.title, currentStepIndex + 1)).trim()
      setIntentLabel(intent)

      if (intent === 'next') {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(currentStepIndex + 1)
        }
        return
      }

      if (intent === 'previous') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(currentStepIndex - 1)
        }
        return
      }

      if (intent === 'repeat') {
        if (currentStep.instruction) {
          await speak(currentStep.instruction, voiceId)
        }
        return
      }

      if (intent.startsWith('timer:')) {
        const mins = Number(intent.split(':')[1])
        if (Number.isFinite(mins) && mins > 0) {
          setTimerSeconds(mins * 60)
          setTimerRunning(true)
        }
        return
      }

      if (intent === 'timer_check') {
        await speak(
          `${Math.floor(timerSeconds / 60)} minutes and ${timerSeconds % 60} seconds remaining`,
          voiceId,
        )
        return
      }

      if (intent === 'question') {
        const answer = await answerCookingQuestion(
          transcript,
          recipe,
          currentStepIndex + 1,
          selectedPersona?.systemPrompt ?? 'You are a helpful cooking coach.',
        )
        await speak(answer, voiceId)
        return
      }

      if (intent === 'ingredients') {
        const list =
          recipe.ingredients.length > 0
            ? recipe.ingredients.join('. ')
            : 'No ingredients were listed for this recipe.'
        await speak(list, voiceId)
        return
      }

      if (intent === 'done') {
        navigate('/done')
      }
    } catch (error) {
      setLastCommand(`Voice error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessingVoice(false)
    }
  }

  const startHold = async () => {
    if (isSpeaking || isProcessingVoice || startHoldLockRef.current) {
      return
    }
    if (holdingActiveRef.current) {
      return
    }
    startHoldLockRef.current = true
    try {
      const handle = await beginHoldRecording()
      holdRef.current = handle
      holdingActiveRef.current = true
      setIsHolding(true)
    } catch (error) {
      setLastCommand(`Mic error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      startHoldLockRef.current = false
    }
  }

  const orbState: VoiceOrbState = isHolding
    ? 'listening'
    : isProcessingVoice
      ? 'thinking'
      : isSpeaking
        ? 'speaking'
        : 'idle'

  const statusPlain = isHolding
    ? 'Listening...'
    : isProcessingVoice
      ? 'Thinking...'
      : isSpeaking
        ? 'Speaking...'
        : 'Hold to talk'

  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white">
      <div className="h-1 w-full bg-gray-900">
        <div className="h-1 bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-center pt-4">
        <TimerDisplay seconds={timerSeconds} flashWarn={timerFlash} />
      </div>

      <section className="flex flex-1 flex-col px-4 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div key={currentStepIndex} className="animate-fade-in w-full">
            <StepDisplay stepText={currentStep?.instruction ?? fallbackInstruction} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              aria-label="Previous step"
              disabled={currentStepIndex <= 0 || isSpeaking || isProcessingVoice}
              onClick={() => currentStepIndex > 0 && setCurrentStepIndex(currentStepIndex - 1)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gray-600 text-2xl text-gray-200 transition hover:border-orange-400 disabled:opacity-30"
            >
              ←
            </button>

            <div
              className="touch-none select-none flex flex-col items-center"
              onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === 'mouse') return
                ;(e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId)
                void startHold()
              }}
              onPointerUp={() => void finishHold()}
              onPointerLeave={() => void finishHold()}
              onPointerCancel={() => void finishHold()}
            >
              <VoiceOrb state={orbState} disabled={isSpeaking || isProcessingVoice} size="lg" />
              <p className="mt-3 text-sm text-gray-400">{statusPlain}</p>
            </div>

            <button
              type="button"
              aria-label="Next step"
              disabled={currentStepIndex >= totalSteps - 1 || isSpeaking || isProcessingVoice}
              onClick={() =>
                currentStepIndex < totalSteps - 1 && setCurrentStepIndex(currentStepIndex + 1)
              }
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gray-600 text-2xl text-gray-200 transition hover:border-orange-400 disabled:opacity-30"
            >
              →
            </button>
          </div>

          {intentLabel ? <p className="text-sm text-emerald-400">Understood: {intentLabel}</p> : null}
          <button
            type="button"
            onClick={() => currentStep?.instruction && void speak(currentStep.instruction, voiceId)}
            disabled={!currentStep?.instruction || isSpeaking || isProcessingVoice || isHolding}
            className="rounded-full border border-gray-600 px-4 py-1 text-xs text-gray-300 transition hover:border-gray-400 disabled:opacity-40"
          >
            Repeat step
          </button>
          <p className="max-w-md text-center text-xs text-gray-500">{lastCommand}</p>
          <button
            type="button"
            onClick={() => navigate('/done')}
            className="mt-2 rounded-full border border-gray-600 px-5 py-2 text-sm text-gray-300 transition hover:border-gray-400"
          >
            Finish Session
          </button>
        </div>
      </section>
    </main>
  )
}
