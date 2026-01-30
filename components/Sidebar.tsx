"use client"

import React, { useState, useEffect } from "react"
import { Plus, Home, Settings, Trash2, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

interface Chat {
  id: string
  title: string
  updatedAt: number
}

interface SidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onOpenSettings: () => void
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive detection after mount to avoid hydration issues
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when selecting chat on mobile
  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId)
    if (isMobile) {
      onToggle()
    }
  }

  const handleNewChat = () => {
    onNewChat()
    if (isMobile) {
      onToggle()
    }
  }

  return (
    <>
      {/* Backdrop - only show on mobile when sidebar is open */}
      {isMobile && isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-[260px] h-screen flex flex-col border-r
          transition-transform duration-300 ease-in-out
        `}
        style={{ 
          borderColor: "rgba(255, 255, 255, 0.06)", 
          background: 'rgba(18, 18, 20, 0.98)', 
          backdropFilter: 'blur(20px)' 
        }}
      >
        {/* Sidebar Header with toggle */}
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}>
          <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Chats</span>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        
        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            className="w-full melon-gradient hover:opacity-90 transition-all duration-200 text-sm"
            style={{ boxShadow: "0 2px 6px rgba(255, 107, 107, 0.15)" }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

      {/* Chat History */}
      <nav className="flex-1 overflow-y-auto scrollbar-melon p-1.5">
        <div className="space-y-0.5">
          {chats.length === 0 ? (
            <div
              className="text-center py-6 px-3"
              style={{ color: "rgba(255, 255, 255, 0.4)" }}
            >
              <p className="text-xs">No history</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === currentChatId
              return (
                <div
                  key={chat.id}
                  className={`group relative rounded-md p-2 cursor-pointer transition-all duration-150 ${
                    isActive ? "border-l-2" : ""
                  }`}
                  style={
                    isActive
                      ? {
                          background: "rgba(255, 107, 107, 0.08)",
                          borderColor: "rgba(255, 107, 107, 0.6)",
                        }
                      : {
                          background: "transparent",
                        }
                  }
                  onClick={() => handleSelectChat(chat.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.02)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent"
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-xs font-medium truncate"
                        style={{
                          color: isActive
                            ? "rgba(255, 255, 255, 0.9)"
                            : "rgba(255, 255, 255, 0.7)",
                        }}
                      >
                        {chat.title}
                      </h4>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "rgba(255, 255, 255, 0.4)" }}
                      >
                        {formatDistanceToNow(chat.updatedAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(chat.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 transition-opacity"
                      aria-label="Delete chat"
                    >
                      <Trash2
                        className="h-3 w-3"
                        style={{ color: "rgba(255, 107, 107, 0.8)" }}
                      />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div
        className="p-2 border-t space-y-1"
        style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
      >
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="w-full justify-start hover:bg-white/5 transition-colors text-xs"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          <Home className="h-3.5 w-3.5 mr-2" />
          New Conversation
        </Button>
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          className="w-full justify-start hover:bg-white/5 transition-colors text-xs"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          <Settings className="h-3.5 w-3.5 mr-2" />
          Settings
        </Button>
      </div>
      </aside>
    </>
  )
}
