import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VoiceOrb } from '../components/VoiceOrb'
import { useAppContext } from '../context/AppContext'
import { recordAndTranscribe } from '../services/elevenlabs'
import { extractRecipeFromImage, generateRecipeFromVoice } from '../services/groq'

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      Generating recipe
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="animate-pulse inline-block" style={{ animationDelay: `${dot * 0.16}s` }}>
          .
        </span>
      ))}
    </span>
  )
}

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

  return (
    <main className="relative min-h-screen bg-[#f5f0e8] px-5 py-6 font-sans text-[#1a1a1a]">
      {voiceOverlay ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f5f0e8]/95 px-6 text-center backdrop-blur">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <div className="absolute h-48 w-48 rounded-full bg-[#2d4a1e]/10 animate-ping" />
            <div className="absolute h-36 w-36 rounded-full bg-[#2d4a1e]/15 animate-pulse" />
            <VoiceOrb state="listening" size="lg" />
          </div>
          <p className="mt-8 text-8xl font-black leading-none text-[#2d4a1e]">{countdown > 0 ? countdown : 'Go'}</p>
          <p className="mt-5 text-2xl font-bold tracking-tight text-[#1a1a1a]">Say the dish name</p>
          <p className="mt-2 text-sm text-[#888]">VoiceChef is listening</p>
        </div>
      ) : null}

      <button type="button" onClick={() => navigate('/')} className="text-sm font-bold text-[#2d4a1e]">
        ← Back
      </button>

      <section className="mt-10">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">How do you want to cook today?</h1>
        <p className="mt-2 text-sm text-[#888]">Bring a recipe or ask VoiceChef to make one.</p>
      </section>

      <section className="mt-8 flex flex-col gap-5">
        <article className="rounded-3xl border-t-4 border-[#2d4a1e] bg-white p-7 shadow-sm">
          <p className="text-6xl">📸</p>
          <h2 className="mt-5 text-2xl font-bold text-[#1a1a1a]">Snap a Recipe</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#888]">Upload a cookbook page, recipe card, or screenshot.</p>
          <button
            type="button"
            onClick={() => !isLoading && fileInputRef.current?.click()}
            disabled={isLoading}
            className="mt-6 w-full rounded-2xl bg-[#2d4a1e] py-4 font-semibold text-white disabled:opacity-50"
          >
            Open Camera
          </button>
        </article>

        <article className="rounded-3xl border-t-4 border-[#7c6a3e] bg-white p-7 shadow-sm">
          <p className="text-6xl">🎙</p>
          <h2 className="mt-5 text-2xl font-bold text-[#1a1a1a]">Say a Dish</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#888]">Name what you want and get a guided recipe.</p>
          <button
            type="button"
            onClick={() => !isLoading && void runVoiceFlow()}
            disabled={isLoading}
            className="mt-6 w-full rounded-2xl bg-[#2d4a1e] py-4 font-semibold text-white disabled:opacity-50"
          >
            Start Voice
          </button>
        </article>
      </section>

      <section className="mt-6 space-y-4 text-center">
        {transcript ? (
          <p className="inline-flex max-w-full rounded-full border border-[#2d4a1e]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2d4a1e]">
            Heard: {transcript}
          </p>
        ) : null}
        {retryMode ? (
          <button
            type="button"
            onClick={() => void runVoiceFlow()}
            className="rounded-2xl border border-[#2d4a1e] bg-transparent px-6 py-3 font-semibold text-[#2d4a1e]"
          >
            Retry
          </button>
        ) : null}
        {isLoading && !voiceOverlay ? (
          <p className="text-sm font-bold text-[#2d4a1e]">
            {loadingMessage === 'Generating recipe...' ? <LoadingDots /> : loadingMessage}
          </p>
        ) : null}
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p> : null}
      </section>

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
