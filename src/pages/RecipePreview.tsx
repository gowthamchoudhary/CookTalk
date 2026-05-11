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

  const steps = recipe?.steps.length
    ? recipe.steps.map((step) => step.instruction)
    : dummySteps

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-4xl flex-col">
        <h1 className="text-3xl font-bold">{recipe?.title ?? 'Your Recipe'}</h1>
        <p className="mt-2 text-gray-400">{steps.length} steps</p>

        {recipe?.ingredients && recipe.ingredients.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm font-semibold text-orange-400">Ingredients</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-300">
              {recipe.ingredients.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 max-h-[55vh] space-y-3 overflow-y-auto">
          {steps.map((instruction, index) => (
            <div key={`${index}-${instruction.slice(0, 24)}`} className="flex gap-4 rounded-2xl bg-gray-900 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="flex-1 text-gray-200">{instruction}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => navigate('/recipe')}
            className="rounded-full border border-gray-600 bg-gray-800 px-8 py-3 font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Re-do
          </button>
          <button
            type="button"
            onClick={() => navigate('/persona')}
            className="rounded-full bg-orange-500 px-8 py-3 font-bold text-white transition hover:bg-orange-400"
          >
            Let&apos;s Cook
          </button>
        </div>
      </div>
    </main>
  )
}
