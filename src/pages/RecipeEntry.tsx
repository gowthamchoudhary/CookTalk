import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VoiceOrb } from '../components/VoiceOrb'
import { useAppContext } from '../context/AppContext'
import { extractRecipeFromImage, generateRecipeFromVoice } from '../services/groq'
import { recordAndTranscribe } from '../services/elevenlabs'

export default function RecipeEntry() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [voiceOverlay, setVoiceOverlay] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [retryMode, setRetryMode] = useState(false)
  const { setRecipe } = useAppContext()

  const isLoading = loadingMessage.length > 0

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result !== 'string') {
          reject(new Error('Could not read image file'))
          return
        }
        const base64 = result.split(',')[1] ?? ''
        if (!base64) {
          reject(new Error('Image conversion failed'))
          return
        }
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (file: File) => {
    try {
      setError('')
      setLoadingMessage('Reading your recipe...')
      const base64 = await fileToBase64(file)
      const recipe = await extractRecipeFromImage(base64)
      setRecipe(recipe)
      navigate('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read recipe from image')
    } finally {
      setLoadingMessage('')
    }
  }

  const runVoiceFlow = async () => {
    setError('')
    setRetryMode(false)
    setTranscript('')
    setVoiceOverlay(true)

    let n = 3
    setCountdown(n)
    const cd = window.setInterval(() => {
      n -= 1
      setCountdown(Math.max(n, 0))
    }, 1000)

    try {
      setLoadingMessage('Listening...')
      const heardText = await recordAndTranscribe()
      clearInterval(cd)
      setCountdown(0)
      setVoiceOverlay(false)

      const cleaned = heardText.trim()
      setTranscript(cleaned)

      if (!cleaned) {
        setRetryMode(true)
        setError("Didn't catch that, try again")
        return
      }

      setLoadingMessage('Generating recipe...')
      const recipe = await generateRecipeFromVoice(cleaned)
      setRecipe(recipe)
      navigate('/preview')
    } catch (err) {
      clearInterval(cd)
      setVoiceOverlay(false)
      setCountdown(0)
      setError(err instanceof Error ? err.message : 'Could not generate recipe')
    } finally {
      setLoadingMessage('')
    }
  }

  const openVoiceOverlay = () => {
    if (!isLoading) {
      void runVoiceFlow()
    }
  }

  return (
    <main className="relative min-h-screen bg-gray-950 px-6 py-10 text-white">
      {voiceOverlay ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm">
          <p className="mb-8 text-center text-xl font-medium text-gray-200">Say the dish you want to make</p>
          <div className="mb-10 text-6xl font-black tabular-nums text-orange-400">
            {countdown > 0 ? countdown : '●'}
          </div>
          <VoiceOrb state="listening" size="lg" />
          <p className="mt-6 text-orange-300">Listening...</p>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="w-full">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-500 transition hover:text-white"
          >
            ← Back
          </button>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold">How do you want to cook today?</h1>

        <div className="mt-12 grid w-full max-w-3xl gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className="cursor-pointer rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center transition-all hover:border-orange-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <p className="text-5xl">📷</p>
            <h2 className="mt-6 text-xl font-semibold">Snap a Recipe</h2>
            <p className="mt-2 text-sm text-gray-400">Photo of any recipe — book, card, screen</p>
          </button>

          <button
            type="button"
            onClick={openVoiceOverlay}
            className="cursor-pointer rounded-3xl border border-gray-800 bg-gray-900 p-8 text-center transition-all hover:border-orange-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <p className="text-5xl">🎤</p>
            <h2 className="mt-6 text-xl font-semibold">Say a Dish</h2>
            <p className="mt-2 text-sm text-gray-400">Just say what you want to make</p>
          </button>
        </div>

        {transcript ? (
          <div className="mt-8 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            Heard: {transcript}
          </div>
        ) : null}

        {retryMode ? (
          <div className="mt-6 space-y-3 text-center">
            <p className="text-gray-400">Didn&apos;t catch that, try again</p>
            <button
              type="button"
              onClick={() => void runVoiceFlow()}
              className="rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Retry
            </button>
          </div>
        ) : null}

        {isLoading && !voiceOverlay ? (
          <div className="mt-8 flex items-center gap-3 text-orange-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
            <p className="text-sm">{loadingMessage}</p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void handleImageUpload(file)
          }
          event.currentTarget.value = ''
        }}
      />
    </main>
  )
}
