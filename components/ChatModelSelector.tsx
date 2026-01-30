"use client"

import { useState, useEffect } from "react"
import { Info, Cpu, Sparkles, Code, FileText, Brain } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ModelSpecsDialog } from "./ModelSpecsDialog"
import { AVAILABLE_MODELS, getModelById, type ModelInfo } from "@/lib/models"

interface ChatModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
}

// Icon mapping for different model types
function getModelIcon(model: ModelInfo) {
  const tags = model.tags.map((t) => t.toLowerCase())
  if (tags.includes("coding") || tags.includes("code")) {
    return <Code className="h-3.5 w-3.5" />
  }
  if (tags.includes("reasoning") || tags.includes("research")) {
    return <Brain className="h-3.5 w-3.5" />
  }
  if (tags.includes("document analysis") || tags.includes("long context")) {
    return <FileText className="h-3.5 w-3.5" />
  }
  return <Sparkles className="h-3.5 w-3.5" />
}

export function ChatModelSelector({
  selectedModel,
  onModelChange,
}: ChatModelSelectorProps) {
  const [specsOpen, setSpecsOpen] = useState(false)
  const [selectedModelForSpecs, setSelectedModelForSpecs] =
    useState<ModelInfo | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentModel = getModelById(selectedModel)

  const handleOpenSpecs = (e: React.MouseEvent, modelId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const model = getModelById(modelId)
    if (model) {
      setSelectedModelForSpecs(model)
      setSpecsOpen(true)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger
            className="h-8 px-2.5 gap-1.5 text-xs font-medium rounded-lg border transition-all duration-200 w-auto min-w-0"
            style={{
              background: "rgba(26, 26, 31, 0.6)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.85)",
            }}
          >
            <Cpu className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--melon-coral)" }} />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {mounted ? (currentModel?.name || "Select model") : "Select model"}
            </span>
          </SelectTrigger>
        <SelectContent
          className="max-h-[400px] overflow-y-auto glass-card"
          style={{
            background: "rgba(26, 26, 31, 0.95)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="py-2.5 px-2 cursor-pointer rounded-md transition-colors group"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: "rgba(255, 107, 107, 0.12)" }}
                  >
                    {getModelIcon(model)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    >
                      {model.name}
                    </div>
                    <div
                      className="text-[10px] truncate"
                      style={{ color: "rgba(255, 255, 255, 0.5)" }}
                    >
                      {model.contextLength} context
                    </div>
                  </div>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded hover:bg-white/10 transition-colors cursor-pointer"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const modelData = getModelById(model.id)
                    if (modelData) {
                      setSelectedModelForSpecs(modelData)
                      setSpecsOpen(true)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      const modelData = getModelById(model.id)
                      if (modelData) {
                        setSelectedModelForSpecs(modelData)
                        setSpecsOpen(true)
                      }
                    }
                  }}
                  style={{ color: "var(--melon-green)" }}
                  title="View specs"
                  aria-label={`View specs for ${model.name}`}
                >
                  <Info className="h-3.5 w-3.5" />
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
        
        {/* Specs button for current model */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg border transition-all duration-200 hover:border-[var(--melon-green)]"
          style={{
            background: "rgba(26, 26, 31, 0.6)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            color: "var(--melon-green)",
          }}
          onClick={(e) => {
            if (currentModel) {
              handleOpenSpecs(e, currentModel.id)
            }
          }}
          title="View model specs"
          aria-label="View model specs"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <ModelSpecsDialog
        model={selectedModelForSpecs}
        open={specsOpen}
        onOpenChange={setSpecsOpen}
      />
    </>
  )
}
