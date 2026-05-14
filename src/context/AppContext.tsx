import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { speakText as speakTextService } from '../services/elevenlabs'
import type { PersonaConfig, Recipe } from '../types'

interface AppContextValue {
  recipe: Recipe | null
  setRecipe: (r: Recipe) => void
  currentStepIndex: number
  setCurrentStepIndex: (i: number) => void
  selectedPersona: PersonaConfig | null
  setSelectedPersona: (p: PersonaConfig) => void
  isListening: boolean
  setIsListening: (b: boolean) => void
  lastCommand: string
  setLastCommand: (s: string) => void
  timerSeconds: number
  setTimerSeconds: (n: number) => void
  timerRunning: boolean
  setTimerRunning: (b: boolean) => void
  cookStartedAt: number | null
  setCookStartedAt: (n: number | null) => void
  isSpeaking: boolean
  speak: (text: string, voiceId: string) => Promise<void>
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: 'drill-sergeant',
    name: 'The Drill Sergeant',
    vibe: 'Aggressive, zero patience',
    emoji: '🪖',
    systemPrompt:
      'You are an aggressive military drill sergeant teaching cooking. Be demanding, impatient, and intense. Short sharp sentences. Never compliment unless earned.',
    voiceId: 'DGzg6RaUqxGRTHSBjfgF',
    wakeWord: 'sergeant',
    language: 'en',
  },
  {
    id: 'nani',
    name: 'Nani',
    vibe: 'Warm Indian grandma energy',
    emoji: '👵',
    systemPrompt:
      'You are a warm loving Indian grandmother teaching cooking. Call the user beta. Be encouraging, add little tips, speak with warmth and love. Occasionally use simple Hindi words.',
    voiceId: 'zMndFmtlJvAIQjxXWZTU',
    wakeWord: 'nani',
    language: 'hi',
  },
  {
    id: 'zen-master',
    name: 'The Zen Master',
    vibe: 'Every step is a life lesson',
    emoji: '🧘',
    systemPrompt:
      'You are a calm zen master teaching cooking as a spiritual practice. Turn every cooking step into a philosophical insight. Speak slowly and thoughtfully.',
    voiceId: 'WczBIOau2qV9z7nLeDqq',
    wakeWord: 'zen',
    language: 'en',
  },
  {
    id: 'hype-man',
    name: 'Hype Man',
    vibe: 'Treats cooking like a sport',
    emoji: '🔥',
    systemPrompt:
      'You are an extremely enthusiastic hype man coaching someone through cooking like its a championship. Use energy, excitement, caps for emphasis. Every step is epic.',
    voiceId: 'WczBIOau2qV9z7nLeDqq',
    wakeWord: 'hype',
    language: 'en',
  },
]

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedPersona, setSelectedPersona] = useState<PersonaConfig | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState('Waiting for your first command...')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [cookStartedAt, setCookStartedAt] = useState<number | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSpeakingRef = useRef(false)

  const speak = useCallback(async (text: string, voiceId: string) => {
    isSpeakingRef.current = true
    setIsSpeaking(true)
    try {
      await speakTextService(text, voiceId)
    } finally {
      isSpeakingRef.current = false
      setIsSpeaking(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      recipe,
      setRecipe,
      currentStepIndex,
      setCurrentStepIndex,
      selectedPersona,
      setSelectedPersona,
      isListening,
      setIsListening,
      lastCommand,
      setLastCommand,
      timerSeconds,
      setTimerSeconds,
      timerRunning,
      setTimerRunning,
      cookStartedAt,
      setCookStartedAt,
      isSpeaking,
      speak,
    }),
    [
      recipe,
      currentStepIndex,
      selectedPersona,
      isListening,
      lastCommand,
      timerSeconds,
      timerRunning,
      cookStartedAt,
      isSpeaking,
      speak,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
