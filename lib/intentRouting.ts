import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "@/lib/models"

export type IntentType = "coding" | "creative" | "analysis" | "image" | "research" | "general"

export interface RoutingResult {
  intent: IntentType
  intentLabel: string
  confidence: number
  modelId: string
}

const INTENT_PHRASES: Record<IntentType, string[]> = {
  coding: [
    "build a function",
    "write code",
    "debug",
    "fix a bug",
    "refactor",
    "implement",
    "stack trace",
    "api",
  ],
  creative: [
    "write a story",
    "craft a narrative",
    "creative writing",
    "poem",
    "lyrics",
    "script",
    "brand voice",
  ],
  analysis: [
    "analyze",
    "analysis",
    "compare",
    "forecast",
    "summarize",
    "data insights",
  ],
  image: [
    "generate an image",
    "create an image",
    "illustration",
    "visual design",
    "poster",
    "logo",
  ],
  research: [
    "research",
    "literature review",
    "academic",
    "citations",
    "study",
  ],
  general: [],
}

const INTENT_SEMANTIC_TOKENS: Record<IntentType, string[]> = {
  coding: ["code", "function", "class", "compile", "bug", "error", "script", "algorithm", "refactor", "debug"],
  creative: ["story", "narrative", "creative", "imagine", "write", "tone", "voice", "poem"],
  analysis: ["analyze", "analysis", "insight", "compare", "evaluate", "metrics", "data", "statistics"],
  image: ["image", "visual", "render", "illustration", "design", "photo", "art"],
  research: ["research", "study", "paper", "citations", "sources", "academic", "survey"],
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
  const tokens = new Set(
    normalized
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  )

  const scores = (Object.keys(INTENT_PHRASES) as IntentType[]).map((intent) => {
    const phraseMatches = INTENT_PHRASES[intent].filter((phrase) => normalized.includes(phrase)).length
    const tokenMatches = INTENT_SEMANTIC_TOKENS[intent].filter((token) => tokens.has(token)).length
    const score = phraseMatches * 3 + tokenMatches
    return { intent, score }
  })

  const best = scores.sort((a, b) => b.score - a.score)[0]
  const resolvedIntent = best.score > 0 ? best.intent : "general"
  const modelId = findAvailableModel(MODEL_PRIORITY[resolvedIntent]) ?? DEFAULT_MODEL_ID
  const confidence = Math.min(95, 45 + best.score * 8)

  return {
    intent: resolvedIntent,
    intentLabel: INTENT_LABELS[resolvedIntent],
    confidence,
    modelId,
  }
}
