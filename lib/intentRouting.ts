import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "@/lib/models"

export type IntentType = "coding" | "creative" | "analysis" | "image" | "research" | "general"

export interface RoutingResult {
  intent: IntentType
  intentLabel: string
  confidence: number
  modelId: string
}

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  coding: ["code", "debug", "bug", "typescript", "javascript", "python", "refactor", "compile", "error", "stack trace", "api", "function"],
  creative: ["write", "story", "poem", "creative", "lyrics", "novel", "script", "content", "brand", "marketing"],
  analysis: ["analyze", "analysis", "insight", "compare", "calculate", "data", "statistics", "chart", "forecast", "summary"],
  image: ["image", "generate image", "illustration", "photo", "art", "render", "design", "poster", "logo"],
  research: ["research", "paper", "citations", "academic", "study", "literature", "survey"],
  general: [],
}

const INTENT_LABELS: Record<IntentType, string> = {
  coding: "Coding",
  creative: "Creative",
  analysis: "Analysis",
  image: "Image",
  research: "Research",
  general: "General",
}

const MODEL_PRIORITY: Record<IntentType, string[]> = {
  coding: ["Qwen/Qwen3-Coder-480B-A35B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct"],
  creative: ["Qwen/Qwen3-Next-80B-A3B-Instruct", "moonshotai/Kimi-K2-Instruct"],
  analysis: ["deepseek-ai/DeepSeek-V3.2-Exp", "google/gemini-2.5-pro"],
  image: ["stabilityai/stable-diffusion-xl-base-1.0"],
  research: ["google/gemini-2.5-pro", "deepseek-ai/DeepSeek-V3.2-Exp"],
  general: [DEFAULT_MODEL_ID],
}

function findAvailableModel(modelIds: string[]): string | null {
  for (const id of modelIds) {
    if (AVAILABLE_MODELS.some((model) => model.id === id)) {
      return id
    }
  }
  return null
}

export function getRoutingRecommendation(prompt: string): RoutingResult {
  const normalized = prompt.toLowerCase()

  const scores = (Object.keys(INTENT_KEYWORDS) as IntentType[]).map((intent) => {
    const keywords = INTENT_KEYWORDS[intent]
    const score = keywords.reduce((acc, keyword) => {
      if (normalized.includes(keyword)) {
        return acc + 1
      }
      return acc
    }, 0)
    return { intent, score }
  })

  const best = scores.sort((a, b) => b.score - a.score)[0]
  const resolvedIntent = best.score > 0 ? best.intent : "general"
  const modelId = findAvailableModel(MODEL_PRIORITY[resolvedIntent]) ?? DEFAULT_MODEL_ID
  const confidence = Math.min(95, 50 + best.score * 10)

  return {
    intent: resolvedIntent,
    intentLabel: INTENT_LABELS[resolvedIntent],
    confidence,
    modelId,
  }
}
