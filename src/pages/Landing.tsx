import { useNavigate } from 'react-router-dom'

function envKeysMissing(): boolean {
  const groq = import.meta.env.VITE_GROQ_API_KEY
  const eleven = import.meta.env.VITE_ELEVENLABS_API_KEY
  const bad = (v: string | undefined) => !v || v === 'your_key_here'
  return bad(groq) || bad(eleven)
}

export default function Landing() {
  const navigate = useNavigate()
  const missingKeys = envKeysMissing()

  return (
    <main className="relative min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-between px-6 py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {['🍅', '🥕', '🧄', '🌿', '🍋', '🫚'].map((e, i) => (
          <span
            key={e}
            className="absolute text-3xl opacity-30 animate-float-slow"
            style={{
              left: `${8 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      {missingKeys && (
        <div className="relative z-10 w-full max-w-md bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 text-center">
          Missing API keys in .env
        </div>
      )}

      <section className="relative z-10 flex flex-col items-center text-center mt-8">
        <div className="w-20 h-20 bg-[#2d4a1e] rounded-3xl flex items-center justify-center text-4xl mb-6">
          🎙
        </div>
        <h1 className="text-6xl font-bold text-[#1a1a1a] tracking-tight">
          Voice<span className="text-[#2d4a1e]">Chef</span>
        </h1>
        <p className="mt-3 text-[#888] text-base">Cook completely hands-free.</p>
        <div className="flex gap-2 flex-wrap justify-center mt-4">
          {['🎙 Voice first', '📸 Snap recipes', '👨‍🍳 4 personas'].map((label) => (
            <span key={label} className="border border-[#ccc] rounded-full px-3 py-1 text-xs text-[#888] bg-white">
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 w-full max-w-md space-y-3 my-8">
        {[
          { n: '1', title: 'Choose a recipe', desc: 'Snap a page or say the dish you want to cook.' },
          { n: '2', title: 'Pick a voice coach', desc: 'Choose a persona with a wake word and a real voice.' },
          { n: '3', title: 'Cook hands-free', desc: 'Move through steps, ask questions, set timers by voice.' },
        ].map((s) => (
          <div key={s.n} className="bg-white rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm">
            <span className="w-8 h-8 bg-[#2d4a1e] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {s.n}
            </span>
            <div>
              <p className="font-semibold text-[#1a1a1a]">{s.title}</p>
              <p className="text-sm text-[#888] mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/recipe')}
          className="w-full bg-[#2d4a1e] text-white rounded-2xl py-5 text-lg font-bold"
        >
          Start Cooking →
        </button>
      </div>
    </main>
  )
}
