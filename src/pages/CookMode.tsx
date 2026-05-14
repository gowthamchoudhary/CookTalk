import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TimerDisplay } from '../components/TimerDisplay'
import { useAppContext } from '../context/AppContext'
import { beginHoldRecording, type HoldRecorder } from '../services/elevenlabs'
import { answerCookingQuestion, parseVoiceIntent } from '../services/groq'
import type { Persona } from '../types'

const almostThereLine: Record<Persona, string> = {
  'drill-sergeant': 'Almost there, soldier! One last push!',
  nani: 'Beta, almost there. Finish with love!',
  'zen-master': 'The final movement approaches. Stay present.',
  'hype-man': 'ALMOST THERE. BRING IT HOME!',
}

type WakeStatus = 'sleeping' | 'listening' | 'activated'

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
    setIsListening,
    timerSeconds,
    setTimerSeconds,
    timerRunning,
    setTimerRunning,
    cookStartedAt,
    setCookStartedAt,
  } = useAppContext()

  const [isHolding, setIsHolding] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [intentLabel, setIntentLabel] = useState('')
  const [timerFlash, setTimerFlash] = useState(false)
  const [wakeStatus, setWakeStatus] = useState<WakeStatus>('sleeping')

  const holdRef = useRef<HoldRecorder | null>(null)
  const holdingActiveRef = useRef(false)
  const startHoldLockRef = useRef(false)
  const oneMinWarnedRef = useRef(false)
  const swipeStartXRef = useRef<number | null>(null)

  const currentStep = recipe?.steps[currentStepIndex]
  const totalSteps = recipe?.steps.length ?? 1
  const fallbackInstruction = 'Welcome to cook mode. Hold the mic or say your wake word.'
  const voiceId = selectedPersona?.voiceId ?? ''
  const wakeWord = selectedPersona?.wakeWord ?? 'chef'

  useEffect(() => {
    if (!cookStartedAt) {
      setCookStartedAt(Date.now())
    }
  }, [cookStartedAt, setCookStartedAt])

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
    if (!timerRunning) return
    if (timerSeconds <= 0) {
      setTimerRunning(false)
      void speak("Timer's up!", voiceId).catch(() => {})
      return
    }

    const timer = window.setTimeout(() => {
      setTimerSeconds(timerSeconds - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
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
    if (!intentLabel) return
    const timeout = window.setTimeout(() => setIntentLabel(''), 2000)
    return () => window.clearTimeout(timeout)
  }, [intentLabel])

  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }, [currentStepIndex, setCurrentStepIndex, totalSteps])

  const goPrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }, [currentStepIndex, setCurrentStepIndex])

  const handleIntent = useCallback(
    async (intent: string, transcript: string) => {
      if (!recipe || !currentStep) return
      if (intent === 'next') {
        if (currentStepIndex < totalSteps - 1) setCurrentStepIndex(currentStepIndex + 1)
      } else if (intent === 'previous') {
        if (currentStepIndex > 0) setCurrentStepIndex(currentStepIndex - 1)
      } else if (intent === 'repeat') {
        await speak(currentStep.instruction, voiceId)
      } else if (intent.startsWith('timer:')) {
        const mins = Number(intent.split(':')[1])
        if (Number.isFinite(mins) && mins > 0) {
          setTimerSeconds(mins * 60)
          setTimerRunning(true)
        }
      } else if (intent === 'timer_check') {
        await speak(`${Math.floor(timerSeconds / 60)} minutes and ${timerSeconds % 60} seconds remaining`, voiceId)
      } else if (intent === 'question') {
        const answer = await answerCookingQuestion(transcript, recipe, currentStepIndex + 1, selectedPersona?.systemPrompt ?? '')
        await speak(answer, voiceId)
      } else if (intent === 'ingredients') {
        const list = recipe.ingredients.length > 0 ? recipe.ingredients.join('. ') : 'No ingredients listed.'
        await speak(list, voiceId)
      } else if (intent === 'done') {
        navigate('/done')
      }
    },
    [
      recipe,
      currentStep,
      currentStepIndex,
      totalSteps,
      timerSeconds,
      voiceId,
      selectedPersona,
      speak,
      navigate,
      setCurrentStepIndex,
      setTimerSeconds,
      setTimerRunning,
    ],
  )

  useEffect(() => {
    if (!selectedPersona) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setWakeStatus('sleeping')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = selectedPersona.language === 'hi' ? 'hi-IN' : 'en-US'

    const activeWakeWord = selectedPersona.wakeWord.toLowerCase()
    let activated = false
    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let commandBuffer = ''
    let stopped = false

    setWakeStatus('listening')

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1]
      if (!last.isFinal) return
      const text = last[0].transcript.toLowerCase().trim()

      if (!activated) {
        if (text.includes(activeWakeWord)) {
          activated = true
          commandBuffer = ''
          setWakeStatus('activated')
          setIsListening(true)
        }
        return
      }

      commandBuffer += ' ' + text
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(async () => {
        activated = false
        setWakeStatus('listening')
        setIsListening(false)
        const cmd = commandBuffer.trim()
        commandBuffer = ''
        if (!cmd || !recipe) return
        setLastCommand(cmd)
        setIsProcessingVoice(true)
        try {
          const intent = (await parseVoiceIntent(cmd, recipe.title, currentStepIndex + 1)).trim()
          setIntentLabel(intent)
          await handleIntent(intent, cmd)
        } catch (e) {
          setLastCommand(`Error: ${e instanceof Error ? e.message : 'unknown'}`)
        } finally {
          setIsProcessingVoice(false)
        }
      }, 1500)
    }

    recognition.onend = () => {
      if (!stopped) {
        setWakeStatus('listening')
        try {
          recognition.start()
        } catch {}
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        stopped = true
        setWakeStatus('sleeping')
      }
    }

    try {
      recognition.start()
    } catch {}

    return () => {
      stopped = true
      setWakeStatus('sleeping')
      setIsListening(false)
      try {
        recognition.stop()
      } catch {}
      if (silenceTimer) clearTimeout(silenceTimer)
    }
  }, [selectedPersona?.id, recipe, currentStepIndex, handleIntent, setIsListening, setLastCommand])

  const finishHold = async () => {
    if (!holdingActiveRef.current || !holdRef.current) {
      return
    }
    holdingActiveRef.current = false
    setIsHolding(false)
    setIsListening(false)

    const recorder = holdRef.current
    holdRef.current = null

    try {
      const transcript = (await recorder.stop()).trim()
      if (!transcript || !recipe) {
        setLastCommand(transcript || '(empty)')
        return
      }
      setLastCommand(transcript)
      setIsProcessingVoice(true)
      const intent = (await parseVoiceIntent(transcript, recipe.title, currentStepIndex + 1)).trim()
      setIntentLabel(intent)
      await handleIntent(intent, transcript)
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
      setIsListening(true)
    } catch (error) {
      setLastCommand(`Mic error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      startHoldLockRef.current = false
    }
  }

  const statusPlain = isHolding ? 'Listening...' : isProcessingVoice ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Hold to talk'
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0
  const wakeDotClass = wakeStatus === 'sleeping' ? 'bg-[#bbb]' : 'bg-[#2d4a1e] animate-pulse'
  const orbClass = isHolding || wakeStatus === 'activated' ? 'bg-red-500' : isSpeaking ? 'bg-blue-500' : 'bg-[#2d4a1e]'

  return (
    <main
      className="flex min-h-screen flex-col bg-[#f5f0e8] font-sans text-[#1a1a1a]"
      onPointerDown={(event) => {
        swipeStartXRef.current = event.clientX
      }}
      onPointerUp={(event) => {
        const startX = swipeStartXRef.current
        swipeStartXRef.current = null
        if (startX == null) return
        const delta = event.clientX - startX
        if (Math.abs(delta) < 70) return
        if (delta < 0) goNext()
        if (delta > 0) goPrevious()
      }}
    >
      <header className="rounded-b-3xl bg-white px-5 py-4 shadow-sm">
        <div className="grid grid-cols-3 items-center gap-3">
          <div>
            <p className="text-xs font-bold text-[#888]">
              Step {currentStepIndex + 1}/{totalSteps}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${wakeDotClass}`} />
              <span className="text-[10px] uppercase tracking-wide text-[#888]">{wakeStatus}</span>
            </div>
            <p className="mt-1 text-xs text-[#888]">Say &quot;{wakeWord}&quot; to activate</p>
          </div>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-[#2d4a1e]">
              {selectedPersona ? `${selectedPersona.emoji} ${selectedPersona.name}` : '🎙 VoiceChef'}
            </p>
          </div>
          <TimerDisplay seconds={timerSeconds} flashWarn={timerFlash} />
        </div>
      </header>

      <div className="h-1 w-full bg-white/70">
        <div className="h-1 bg-[#2d4a1e] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
        <div key={currentStepIndex} className="animate-fade-in relative flex w-full max-w-2xl items-center justify-center py-10 text-center">
          <span className="pointer-events-none absolute left-1/2 top-1/2 select-none -translate-x-1/2 -translate-y-1/2 text-[180px] font-black leading-none text-[#1a1a1a]/5">
            {currentStepIndex + 1}
          </span>
          <div className="relative z-10">
            <p className="mx-auto max-w-sm text-center text-2xl font-bold leading-relaxed text-[#1a1a1a]">
              {currentStep?.instruction ?? fallbackInstruction}
            </p>
            {intentLabel ? <p className="mt-6 text-center text-xs font-bold text-[#2d4a1e]">Understood: {intentLabel}</p> : null}
          </div>
        </div>
      </section>

      <section className="px-5 pb-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            aria-label="Previous step"
            disabled={currentStepIndex <= 0 || isSpeaking || isProcessingVoice}
            onClick={goPrevious}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-xl font-bold text-[#1a1a1a] shadow-sm disabled:opacity-30"
          >
            ←
          </button>

          <div
            className="touch-none select-none text-center"
            onPointerDown={(event) => {
              event.stopPropagation()
              if (event.button !== 0 && event.pointerType === 'mouse') return
              ;(event.currentTarget as HTMLDivElement).setPointerCapture?.(event.pointerId)
              void startHold()
            }}
            onPointerUp={(event) => {
              event.stopPropagation()
              void finishHold()
            }}
            onPointerLeave={() => void finishHold()}
            onPointerCancel={() => void finishHold()}
          >
            <div className="relative flex h-[104px] w-[104px] items-center justify-center">
              <div className="absolute h-[104px] w-[104px] rounded-full bg-[#2d4a1e]/10 animate-pulse" />
              <button
                type="button"
                aria-label="Voice control"
                disabled={isSpeaking || isProcessingVoice}
                className={`relative z-10 flex h-[78px] w-[78px] items-center justify-center rounded-full text-3xl text-white shadow-sm disabled:opacity-50 ${orbClass}`}
              >
                🎙
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-[#888]">{statusPlain}</p>
          </div>

          <button
            type="button"
            aria-label="Next step"
            disabled={currentStepIndex >= totalSteps - 1 || isSpeaking || isProcessingVoice}
            onClick={goNext}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-xl font-bold text-[#1a1a1a] shadow-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      </section>

      <footer className="border-t border-[#e8e8e8] bg-white px-5 py-3 text-xs text-[#888]">
        <span>{lastCommand}</span>
        <button type="button" onClick={() => navigate('/done')} className="ml-3 font-bold text-[#2d4a1e]">
          Finish
        </button>
      </footer>
    </main>
  )
}
