"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Code, Pen, Brain, Globe, Sparkles } from "lucide-react"
import {
  AVAILABLE_MODELS,
  MODEL_CATEGORIES,
  getModelById,
  getModelsByCategory,
  type ModelCategory,
  type ModelInfo,
} from "@/lib/models"

interface ChatModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
}

// Category icon mapping
function getCategoryIcon(categoryId: ModelCategory) {
  switch (categoryId) {
    case "general":
      return <Sparkles className="h-3.5 w-3.5" />
    case "coders":
      return <Code className="h-3.5 w-3.5" />
    case "creators":
      return <Pen className="h-3.5 w-3.5" />
    case "reasoning":
      return <Brain className="h-3.5 w-3.5" />
    case "enterprise":
      return <Globe className="h-3.5 w-3.5" />
    default:
      return <Sparkles className="h-3.5 w-3.5" />
  }
}

// Category label with emoji
function getCategoryLabel(categoryId: ModelCategory) {
  switch (categoryId) {
    case "general":
      return "General"
    case "coders":
      return "Coders"
    case "creators":
      return "Creators"
    case "reasoning":
      return "Reasoning"
    case "enterprise":
      return "Enterprise"
    default:
      return categoryId
  }
}

export function ChatModelSelector({
  selectedModel,
  onModelChange,
}: ChatModelSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ModelCategory>("general")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current model info
  const currentModel = getModelById(selectedModel)

  // Get models for active category
  const categoryModels = getModelsByCategory(activeCategory)

  // Find current model's category to highlight the right tab
  useEffect(() => {
    if (currentModel) {
      setActiveCategory(currentModel.category)
    }
  }, [currentModel])

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:border-[var(--melon-green)] text-left"
        style={{
          background: "rgba(26, 26, 31, 0.6)",
          borderColor: isOpen ? "var(--melon-green)" : "rgba(255, 255, 255, 0.1)",
        }}
      >
        <span
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "rgba(255, 107, 107, 0.12)", color: "var(--melon-coral)" }}
        >
          {currentModel ? getCategoryIcon(currentModel.category) : <Sparkles className="h-3.5 w-3.5" />}
        </span>
        <span className="text-sm font-medium truncate max-w-[140px]" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
          {mounted ? (currentModel?.name || "Select Model") : "Select Model"}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div
            className="absolute bottom-full left-0 mb-2 z-50 w-[320px] rounded-xl border shadow-xl overflow-hidden"
            style={{
              background: "rgba(26, 26, 31, 0.98)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Category Tabs */}
            <div
              className="flex gap-1 p-2 border-b overflow-x-auto scrollbar-none"
              style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
            >
              {MODEL_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeCategory === category.id
                      ? "ring-1 ring-[var(--melon-green)]"
                      : "hover:bg-white/5"
                  }`}
                  style={{
                    background:
                      activeCategory === category.id
                        ? "rgba(152, 216, 200, 0.15)"
                        : "transparent",
                    color:
                      activeCategory === category.id
                        ? "var(--melon-green)"
                        : "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {getCategoryIcon(category.id)}
                  <span>{getCategoryLabel(category.id)}</span>
                </button>
              ))}
            </div>

            {/* Models List */}
            <div className="max-h-[240px] overflow-y-auto scrollbar-melon p-2">
              {categoryModels.length > 0 ? (
                <div className="space-y-1">
                  {categoryModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left ${
                        selectedModel === model.id
                          ? "ring-1 ring-[var(--melon-coral)]"
                          : "hover:bg-white/5"
                      }`}
                      style={{
                        background:
                          selectedModel === model.id
                            ? "rgba(255, 107, 107, 0.1)"
                            : "transparent",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: "rgba(255, 255, 255, 0.95)" }}
                        >
                          {model.name}
                        </div>
                        <div
                          className="text-[11px] truncate mt-0.5"
                          style={{ color: "rgba(255, 255, 255, 0.5)" }}
                        >
                          {model.contextLength} context
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: "var(--melon-coral)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-6 text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.5)" }}
                >
                  No models in this category
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div
              className="px-3 py-2 border-t text-[10px]"
              style={{
                borderColor: "rgba(255, 255, 255, 0.08)",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              10 elite models across 5 categories
            </div>
          </div>
        </>
      )}
    </div>
  )
}
