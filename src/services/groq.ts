import axios from 'axios'
import type { Recipe } from '../types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

function parseGroqJSON(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  return JSON.parse(cleaned)
}

function toRecipe(raw: any): Recipe {
  const ingredients = Array.isArray(raw?.ingredients)
    ? raw.ingredients.map((item: unknown) => String(item))
    : []

  return {
    title: String(raw?.title ?? 'Untitled Recipe'),
    totalSteps: Number(raw?.totalSteps ?? raw?.steps?.length ?? 0),
    ingredients,
    steps: Array.isArray(raw?.steps)
      ? raw.steps.map((step: any, index: number) => ({
          stepNumber: Number(step?.stepNumber ?? index + 1),
          instruction: String(step?.instruction ?? ''),
          ...(step?.timerMinutes != null ? { timerMinutes: Number(step.timerMinutes) } : {}),
        }))
      : [],
  }
}

const RECIPE_JSON_SHAPE = `{ title: string, totalSteps: number, ingredients: string[], steps: [ { stepNumber: number, instruction: string, timerMinutes?: number } ] }`

// Takes a dish name spoken by user, returns structured recipe
export async function generateRecipeFromVoice(dishName: string): Promise<Recipe> {
  try {
    if (!GROQ_KEY) {
      throw new Error('Missing VITE_GROQ_API_KEY')
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a cooking assistant. Return ONLY valid JSON, no markdown, no explanation. Extract a complete ingredients array (each ingredient as a short string, with amounts when possible). ${RECIPE_JSON_SHAPE}`,
          },
          {
            role: 'user',
            content: `Generate a detailed step-by-step recipe for: ${dishName}. Return JSON in exactly this format: ${RECIPE_JSON_SHAPE}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw new Error('Groq returned an empty response')
    }

    return toRecipe(parseGroqJSON(content))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage =
        error.response?.data?.error?.message || error.response?.statusText || error.message
      throw new Error(`Failed to generate recipe from voice: ${apiMessage}`)
    }
    throw new Error(
      `Failed to generate recipe from voice: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Takes a base64 image of a recipe, returns structured recipe
export async function extractRecipeFromImage(base64Image: string): Promise<Recipe> {
  try {
    if (!GROQ_KEY) {
      throw new Error('Missing VITE_GROQ_API_KEY')
    }

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the recipe from this image. Return ONLY valid JSON, no markdown. Include an ingredients array listing every ingredient with amounts when visible. ${RECIPE_JSON_SHAPE}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw new Error('Groq returned an empty response')
    }

    return toRecipe(parseGroqJSON(content))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiMessage =
        error.response?.data?.error?.message || error.response?.statusText || error.message
      throw new Error(`Failed to extract recipe from image: ${apiMessage}`)
    }
    throw new Error(
      `Failed to extract recipe from image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Takes transcript + current recipe context, returns intent as string
export async function parseVoiceIntent(
  transcript: string,
  recipeTitle: string,
  currentStep: number,
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a voice command parser for a cooking app. The user is cooking "${recipeTitle}", currently on step ${currentStep}. 
          Classify the transcript into EXACTLY one of these intents:
          - "next" — user wants to go to next step
          - "previous" — user wants to go back
          - "repeat" — user wants current step repeated
          - "timer:N" — user wants to set a timer for N minutes (extract the number)
          - "timer_check" — user asks how long is left on timer
          - "question" — user is asking a cooking question or needs help
          - "ingredients" — user wants to hear the ingredients list
          - "done" — user says they are finished cooking
          Return ONLY the intent string, nothing else.`,
        },
        { role: 'user', content: transcript },
      ],
      max_tokens: 20,
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// Takes a freeform question + recipe context, returns answer string
export async function answerCookingQuestion(
  question: string,
  recipe: Recipe,
  currentStep: number,
  personaPrompt: string,
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `${personaPrompt} The user is cooking "${recipe.title}" and is on step ${currentStep} of ${recipe.totalSteps}. Answer their cooking question briefly and in character. Max 2 sentences.`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 100,
    }),
  })
  const data = await response.json()
  return data.choices[0].message.content.trim()
}
