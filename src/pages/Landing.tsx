import { useNavigate } from 'react-router-dom'

function envKeysMissing(): boolean {
  const groq = import.meta.env.VITE_GROQ_API_KEY
  const eleven = import.meta.env.VITE_ELEVENLABS_API_KEY
  const bad = (v: string | undefined) => !v || v === 'your_key_here'
  return bad(groq) || bad(eleven)
}

const floatEmojis = ['🍅', '🥕', '🧄', '🌿', '🥘', '🍋']

export default function Landing() {
  const navigate = useNavigate()
  const missingKeys = envKeysMissing()

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-950 px-6 text-center text-white">
      <div className="pointer-events-none absolute inset-0">
        {floatEmojis.map((emoji, i) => (
          <span
            key={i}
            className="animate-float absolute text-4xl opacity-50"
            style={{
              left: `${8 + i * 15}%`,
              top: `${12 + (i % 3) * 22}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center">
        {missingKeys ? (
          <p className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Missing API keys — add them to <code className="text-amber-100">.env</code> (VITE_GROQ_API_KEY and
            VITE_ELEVENLABS_API_KEY)
          </p>
        ) : null}

        <h1 className="text-6xl font-bold text-white">VoiceChef</h1>
        <p className="mt-6 text-xl text-gray-400">Cook hands-free. Your voice is the spatula.</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300">
            Voice controlled
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300">
            Snap any recipe
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300">
            4 chef personas
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/recipe')}
          className="mt-12 rounded-full bg-orange-500 px-10 py-4 text-xl font-bold text-white transition hover:bg-orange-400"
        >
          Start Cooking
        </button>

        <h2 className="mt-20 text-lg font-semibold text-white">How it works</h2>
        <div className="mt-8 grid w-full max-w-4xl gap-6 md:grid-cols-3">
          {[
            { n: 1, t: 'Snap or say — get a structured recipe from a photo or your voice.' },
            { n: 2, t: 'Pick your chef — each persona guides you with a different vibe.' },
            { n: 3, t: 'Cook hands-free — steps, timers, and questions through voice.' },
          ].map((card) => (
            <div key={card.n} className="rounded-2xl bg-gray-900 p-6 text-left text-gray-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
                {card.n}
              </span>
              <p className="mt-4 text-sm leading-relaxed">{card.t}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
