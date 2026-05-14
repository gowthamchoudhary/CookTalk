import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const dummySteps = [
  'Prep all ingredients.',
  'Heat your pan over medium heat.',
  'Add aromatics and stir until fragrant.',
  'Cook main ingredients until done.',
  'Finish, taste, and plate.',
]

export default function RecipePreview() {
  const navigate = useNavigate()
  const { recipe } = useAppContext()

  const steps = recipe?.steps.length ? recipe.steps.map((step) => step.instruction) : dummySteps
  const title = recipe?.title ?? 'Your Recipe'

  return (
    <main className="min-h-screen bg-[#f5f0e8] pb-6 font-sans text-[#1a1a1a]">
      <header className="sticky top-0 z-30 bg-[#f5f0e8] pt-6 px-5 pb-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="min-w-0 text-2xl font-bold tracking-tight text-[#1a1a1a]">{title}</h1>
          <span className="shrink-0 rounded-full bg-[#2d4a1e] px-3 py-1 text-xs font-bold text-white">
            {steps.length} steps
          </span>
        </div>
      </header>

      <div className="px-5 pt-4">
        {recipe?.ingredients && recipe.ingredients.length > 0 ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-gradient-to-br from-[#f0ebe0] to-white p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-[#2d4a1e]">Ingredients</p>
              <ul className="mt-4 grid gap-2 text-sm text-[#1a1a1a]">
                {recipe.ingredients.map((item) => (
                  <li key={item} className="rounded-xl bg-white/70 px-3 py-2 text-[#1a1a1a]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="mt-6 pb-5">
          {steps.map((instruction, index) => (
            <article key={`${index}-${instruction.slice(0, 24)}`} className="mb-3 flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2d4a1e] text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-[#1a1a1a]">{instruction}</p>
            </article>
          ))}
        </section>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/recipe')}
            className="w-full rounded-2xl border border-[#2d4a1e] bg-transparent py-4 font-semibold text-[#2d4a1e]"
          >
            Re-do
          </button>
          <button
            type="button"
            onClick={() => navigate('/persona')}
            className="w-full rounded-2xl bg-[#2d4a1e] py-4 font-semibold text-white"
          >
            Let's Cook →
          </button>
        </div>
      </div>
    </main>
  )
}
