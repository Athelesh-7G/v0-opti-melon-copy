"use client"

import React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Send, Loader2, Sparkles, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageBubble } from "./MessageBubble"
import { SettingsPanel } from "./SettingsPanel"
import { Sidebar } from "./Sidebar"
import { ThemeToggle } from "./ThemeToggle"
import { AnimatedBackground } from "./AnimatedBackground"
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

interface Chat {
  id: string
  title: string
  updatedAt: number
  messages: StoredMessage[]
}

export function ChatWindow() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
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
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    // Immediately stop loading to return Send button
    setIsLoading(false)
  }, [])

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
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

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
        signal: abortControllerRef.current.signal,
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
      // Don't show error if it was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape - Stop streaming
      if (e.key === 'Escape' && isLoading) {
        handleStop()
      }
    }
    
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isLoading, handleStop])

  const handleClearChat = useCallback(() => {
    setMessages([])
    clearMessages()
    setError(null)
  }, [])

  const handleNewChat = useCallback(() => {
    const newChatId = crypto.randomUUID()
    
    // Save current chat if it has messages
    if (currentChatId && messages.length > 0) {
      setChats((prev) => {
        const existing = prev.find((c) => c.id === currentChatId)
        if (existing) {
          return prev.map((c) =>
            c.id === currentChatId
              ? { ...c, messages, updatedAt: Date.now() }
              : c
          )
        }
        return [
          ...prev,
          {
            id: currentChatId,
            title: messages[0]?.content.slice(0, 50) || "New Chat",
            messages,
            updatedAt: Date.now(),
          },
        ]
      })
    }

    setCurrentChatId(newChatId)
    setMessages([])
    setInput("")
    setError(null)
  }, [currentChatId, messages])

  const handleSelectChat = useCallback((chatId: string) => {
    // Save current chat before switching
    if (currentChatId && messages.length > 0) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages, updatedAt: Date.now() }
            : c
        )
      )
    }

    const selectedChat = chats.find((c) => c.id === chatId)
    if (selectedChat) {
      setCurrentChatId(chatId)
      setMessages(selectedChat.messages)
      setError(null)
    }
  }, [chats, currentChatId, messages])

  const handleDeleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (currentChatId === chatId) {
      handleNewChat()
    }
  }, [currentChatId, handleNewChat])

  // Initialize with a new chat
  useEffect(() => {
    if (!currentChatId && chats.length === 0) {
      setCurrentChatId(crypto.randomUUID())
    }
  }, [currentChatId, chats.length])

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setSettingsOpen(!settingsOpen)}
      />

      {/* Main Chat Panel */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* Header with glass effect */}
        <header className="flex-shrink-0 border-b px-3 sm:px-4 py-3 sm:py-4 glass-card border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between pl-12 md:pl-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl melon-gradient flex items-center justify-center shadow-md">
              <span className="text-sm sm:text-base" role="img" aria-label="watermelon">🍉</span>
            </div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              OptiMelon
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/30">
              <span className="text-xs font-mono truncate max-w-[140px] text-muted-foreground">{model.split("/").pop()}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto scrollbar-melon relative">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] sm:h-[60vh] text-center px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center bg-primary/10">
                  <span className="text-4xl sm:text-5xl" role="img" aria-label="watermelon">🍉</span>
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 animate-pulse text-accent" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">
                Welcome to OptiMelon
              </h2>
              <p className="max-w-md mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base text-muted-foreground">
                A clean, high-signal LLM wrapper that adapts to your needs. 
                Coding assistance, productivity help, or study guidance - all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[
                  { text: "Help me code", icon: "💻" },
                  { text: "Explain a concept", icon: "📚" },
                  { text: "Draft an email", icon: "✉️" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setInput(suggestion.text)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all duration-200 text-xs sm:text-sm hover:scale-105 bg-secondary/30 border-border text-foreground hover:bg-secondary/50"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Welcome to OptiMelon
              </h2>
              <p className="max-w-md mb-8 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                A clean, high-signal LLM wrapper that adapts to your needs. 
                Coding assistance, productivity help, or study guidance - all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { text: "Help me code", icon: "💻" },
                  { text: "Explain a concept", icon: "📚" },
                  { text: "Draft an email", icon: "���️" },
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setInput(suggestion.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(255, 255, 255, 0.85)'
                    }}
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
                <div className="flex gap-3" style={{ animation: 'messageEnter 0.3s ease-out' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/10 text-accent">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="border rounded-2xl px-4 py-3 shadow-sm bg-card border-border">
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
        <div className="flex-shrink-0 border-t px-3 sm:px-4 py-3 bg-destructive/10 border-destructive/20" style={{ animation: 'messageEnter 0.3s ease-out' }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Input area */}
      <footer className="flex-shrink-0 border-t px-3 sm:px-4 py-2.5 sm:py-3 sticky bottom-0 glass-card border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-2.5 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message OptiMelon..."
                className="min-h-[48px] sm:min-h-[52px] max-h-[200px] resize-none pr-3 py-2.5 sm:py-3 rounded-xl transition-all glass-input text-sm"
                disabled={isLoading}
              />
            </div>
            {isLoading ? (
              <Button
                onClick={handleStop}
                size="icon"
                className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] rounded-xl transition-all duration-200 border flex-shrink-0 bg-primary/15 border-primary/40 text-primary hover:bg-primary/20"
                style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                onClick={sendMessage}
                disabled={!input.trim()}
                size="icon"
                className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] rounded-xl melon-gradient shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </Button>
            )}
          </div>
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
    </div>
  )
}
