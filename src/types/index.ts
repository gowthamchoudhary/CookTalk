export type Persona = 'drill-sergeant' | 'nani' | 'zen-master' | 'hype-man'

export interface PersonaConfig {
  id: Persona
  name: string
  vibe: string
  emoji: string
  systemPrompt: string
  voiceId: string
  wakeWord: string
  language: 'en' | 'hi' | 'es'
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
  timerMinutes?: number // optional timer for this step
}

export interface Recipe {
  title: string
  totalSteps: number
  steps: RecipeStep[]
  ingredients: string[]
}

export type AppScreen = 'landing' | 'recipe-entry' | 'preview' | 'persona' | 'cook' | 'done'
