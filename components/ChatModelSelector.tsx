"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Code, Pen, Brain, Globe, Sparkles } from "lucide-react"
import {
  AVAILABLE_MODELS,
  MODEL_CATEGORIES,
  getModelById,
  getModelsByCategory,
  type ModelCategory,
} from "@/lib/models"

interface ChatModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
}

// Category config with icon and color
const CATEGORY_CONFIG: Record<ModelCategory, { icon: React.ReactNode; color: string; bgColor: string }> = {
  general: {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "var(--melon-green)",
    bgColor: "rgba(152, 216, 200, 0.15)",
  },
  coders: {
    icon: <Code className="h-3.5 w-3.5" />,
    color: "var(--melon-coral)",
    bgColor: "rgba(255, 107, 107, 0.15)",
  },
  creators: {
    icon: <Pen className="h-3.5 w-3.5" />,
    color: "var(--melon-pink)",
    bgColor: "rgba(255, 179, 179, 0.15)",
  },
  reasoning: {
    icon: <Brain className="h-3.5 w-3.5" />,
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.15)",
  },
  enterprise: {
    icon: <Globe className="h-3.5 w-3.5" />,
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.15)",
  },
}

// Individual Category Dropdown Component
function CategoryDropdown({
  category,
  selectedModel,
  onModelChange,
}: {
  category: ModelCategory
  selectedModel: string
  onModelChange: (modelId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const config = CATEGORY_CONFIG[category]
  const models = getModelsByCategory(category)
  const categoryInfo = MODEL_CATEGORIES.find((c) => c.id === category)
  
  // Check if selected model is in this category
  const selectedInThisCategory = models.some((m) => m.id === selectedModel)
  const selectedModelInCategory = models.find((m) => m.id === selectedModel)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Category Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${
          selectedInThisCategory ? "ring-1" : "hover:border-white/20"
        }`}
        style={{
          background: selectedInThisCategory ? config.bgColor : "rgba(255, 255, 255, 0.03)",
          borderColor: selectedInThisCategory ? config.color : "rgba(255, 255, 255, 0.08)",
          color: selectedInThisCategory ? config.color : "rgba(255, 255, 255, 0.7)",
          ringColor: selectedInThisCategory ? config.color : undefined,
        }}
      >
        {config.icon}
        <span>{categoryInfo?.label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ opacity: 0.6 }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] rounded-lg border shadow-xl overflow-hidden"
          style={{
            background: "rgba(26, 26, 31, 0.98)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Category Header */}
          <div
            className="px-3 py-2 border-b flex items-center gap-2"
            style={{
              borderColor: "rgba(255, 255, 255, 0.08)",
              background: config.bgColor,
            }}
          >
            <span style={{ color: config.color }}>{config.icon}</span>
            <span className="text-xs font-semibold" style={{ color: config.color }}>
              {categoryInfo?.label}
            </span>
            <span className="text-[10px] ml-auto" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
              {models.length} model{models.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Models List */}
          <div className="p-1.5 max-h-[200px] overflow-y-auto scrollbar-melon">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 text-left ${
                  selectedModel === model.id ? "" : "hover:bg-white/5"
                }`}
                style={{
                  background: selectedModel === model.id ? config.bgColor : "transparent",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{
                      color: selectedModel === model.id ? config.color : "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    {model.name}
                  </div>
                  <div
                    className="text-[10px] truncate"
                    style={{ color: "rgba(255, 255, 255, 0.45)" }}
                  >
                    {model.contextLength}
                  </div>
                </div>
                {selectedModel === model.id && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: config.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ChatModelSelector({
  selectedModel,
  onModelChange,
}: ChatModelSelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5">
        {MODEL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="h-8 w-20 rounded-lg animate-pulse"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {MODEL_CATEGORIES.map((category) => (
        <CategoryDropdown
          key={category.id}
          category={category.id}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      ))}
    </div>
  )
}
