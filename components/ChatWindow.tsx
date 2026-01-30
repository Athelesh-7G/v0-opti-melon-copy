"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageBubble } from "./MessageBubble"
import { SettingsPanel } from "./SettingsPanel"
import { DEFAULT_SYSTEM_PROMPT, buildMessages } from "@/lib/promptTemplate"
import {
  saveMessages,
  loadMessages,
  clearMessages,
  saveSettings,
  loadSettings,
  type StoredMessage,
  type Provider,
} from "@/lib/storage"

// Provider display names
const PROVIDER_NAMES: Record<Provider, string> = {
  bytez: "Bytez",
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
  moonshot: "Moonshot",
  deepseek: "DeepSeek",
  groq: "Groq",
  together: "Together",
}

export function ChatWindow() {
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [provider, setProvider] = useState<Provider>("bytez")
  const [model, setModel] = useState("Qwen/Qwen3-8B")
  const [temperature, setTemperature] = useState(0.7)
  const [streaming, setStreaming] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState<string | null>(DEFAULT_SYSTEM_PROMPT)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const storedMessages = loadMessages()
    const storedSettings = loadSettings()
    if (storedMessages.length > 0) {
      setMessages(storedMessages)
    }
    if (storedSettings) {
      setProvider(storedSettings.provider)
      setModel(storedSettings.model)
      setTemperature(storedSettings.temperature)
      setStreaming(storedSettings.streaming)
      setSystemPrompt(storedSettings.systemPrompt)
    }
  }, [])

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  useEffect(() => {
    saveSettings({ provider, model, temperature, streaming, systemPrompt })
  }, [provider, model, temperature, streaming, systemPrompt])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: StoredMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setError(null)
    setIsLoading(true)

    const assistantId = crypto.randomUUID()

    try {
      const conversationMessages = [...messages, userMessage].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

      const fullMessages = buildMessages(systemPrompt, conversationMessages)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullMessages,
          provider,
          model,
          params: { temperature, max_tokens: 4096 },
          stream: streaming,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      if (streaming && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ""

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  assistantContent += content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: assistantContent } : m
                    )
                  )
                }
              } catch {
                if (data.trim() && data !== "[DONE]") {
                  assistantContent += data
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: assistantContent } : m
                    )
                  )
                }
              }
            }
          }
        }
      } else {
        const data = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, provider, model, temperature, streaming, systemPrompt, isLoading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const handleClearChat = useCallback(() => {
    setMessages([])
    clearMessages()
    setError(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with gradient accent */}
      <header className="flex-shrink-0 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-lg" role="img" aria-label="watermelon">🍉</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background text-green-600 bg-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                OptiMelon
              </h1>
              <p className="text-xs text-muted-foreground">High-signal AI assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-foreground">{PROVIDER_NAMES[provider]}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-sm truncate max-w-[120px] text-muted-foreground">{model.split("/").pop()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto scrollbar-melon">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-5xl" role="img" aria-label="watermelon">🍉</span>
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to OptiMelon
              </h2>
              <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                A clean, high-signal LLM wrapper that adapts to your needs. 
                Coding assistance, productivity help, or study guidance - all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { text: "Help me code", icon: "💻" },
                  { text: "Explain a concept", icon: "📚" },
                  { text: "Draft an email", icon: "✉️" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setInput(suggestion.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 transition-all duration-200 text-sm"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Thinking</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Error display */}
      {error && (
        <div className="flex-shrink-0 bg-destructive/10 border-t border-destructive/20 px-4 py-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Input area */}
      <footer className="flex-shrink-0 border-t border-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="min-h-[56px] max-h-[200px] resize-none pr-4 rounded-2xl bg-card border-border focus:border-primary/50 focus:ring-primary/20 transition-all"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send
          </p>
        </div>
      </footer>

      <SettingsPanel
        isOpen={settingsOpen}
        onToggle={() => setSettingsOpen(!settingsOpen)}
        provider={provider}
        model={model}
        temperature={temperature}
        streaming={streaming}
        systemPrompt={systemPrompt}
        onProviderChange={setProvider}
        onModelChange={setModel}
        onTemperatureChange={setTemperature}
        onStreamingChange={setStreaming}
        onSystemPromptChange={setSystemPrompt}
        onClearChat={handleClearChat}
      />
    </div>
  )
}
