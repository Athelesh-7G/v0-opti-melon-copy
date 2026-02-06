"use client"

import React from "react"

interface AnimatedLoaderProps {
  type?: "text" | "image"
  progress?: number | null
}

export function AnimatedLoader({ type = "text", progress = null }: AnimatedLoaderProps) {
  const statusText = type === "image" ? "Image is now being generated..." : "Generating response..."

  return (
    <div className="flex gap-3 items-start" style={{ animation: "messageEnter 0.3s ease-out" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/15 text-accent">
        <div className="flowing-loader" aria-hidden="true" />
      </div>
      <div className="border border-border rounded-2xl px-4 py-3 shadow-sm bg-card">
        <div className="flex items-center gap-2">
          <span className="text-foreground/70 text-sm">{statusText}</span>
          <div className="flowing-loader" aria-label="Loading" role="status" />
        </div>
        {typeof progress === "number" && (
          <div className="mt-2 text-xs text-muted-foreground">Progress: {progress}%</div>
        )}
        <p className="text-xs mt-1 hidden sm:block text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded text-[10px] border border-border bg-secondary">Esc</kbd> to stop
        </p>
      </div>
    </div>
  )
}
