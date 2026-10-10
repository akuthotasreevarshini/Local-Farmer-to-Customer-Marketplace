import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Trash2, Sparkles, Bot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../api/axiosInstance'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: 'ai' | 'rules'
  note?: string
}

const SUGGESTIONS_EN = [
  'How do I register as a farmer?',
  'How to add products to the marketplace?',
  'How does group buying work?',
  'How to compare prices?',
  'Tips for growing tomatoes',
  'How to protect crops from pests?',
]
const SUGGESTIONS_TE = [
  'రైతుగా ఎలా నమోదు చేసుకోవాలి?',
  'ఉత్పత్తులను ఎలా జోడించాలి?',
  'ధరలు ఎలా పోల్చాలి?',
  'టమాటాలు ఎలా పెంచాలి?',
]
const SUGGESTIONS_HI = [
  'किसान के रूप में कैसे रजिस्टर करें?',
  'उत्पाद कैसे जोड़ें?',
  'कीमतें कैसे तुलना करें?',
  'फसल को कीटों से कैसे बचाएं?',
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState(SUGGESTIONS_EN)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, i18n } = useTranslation()

  // Update suggestions when language changes
  useEffect(() => {
    if (i18n.language === 'te') setSuggestions(SUGGESTIONS_TE)
    else if (i18n.language === 'hi') setSuggestions(SUGGESTIONS_HI)
    else setSuggestions(SUGGESTIONS_EN)
  }, [i18n.language])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    // Add welcome message on first open
    if (open && messages.length === 0) {
      setMessages([{ id: 'welcome', role: 'assistant', content: t('ai.welcome'), source: 'rules' }])
    }
  }, [open, messages.length, t])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const { data } = await axiosInstance.post<{
        success: boolean
        data: { reply: string; source: 'ai' | 'rules'; note?: string }
      }>('/api/ai/chat', { message: trimmed, history })

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data.reply,
        source: data.data.source,
        note: data.data.note,
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('ai.error'),
        source: 'rules',
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const clearChat = () => {
    setMessages([{ id: 'welcome2', role: 'assistant', content: t('ai.welcome'), source: 'rules' }])
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#2D6A2D] text-white shadow-lg flex items-center justify-center hover:bg-[#245424] transition-all active:scale-95"
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        style={{ boxShadow: '0 4px 20px rgba(45,106,45,0.4)' }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[340px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ height: '500px', maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Header */}
          <div className="bg-[#2D6A2D] text-white px-4 py-3 rounded-t-2xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <div>
                <p className="font-semibold text-sm">{t('ai.title')}</p>
                <p className="text-xs text-white/70">FarmConnect Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} title={t('ai.clear')} className="p-1 hover:bg-white/20 rounded transition-colors">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#2D6A2D] flex items-center justify-center shrink-0 mt-1">
                    <Bot size={14} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-[#2D6A2D] text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {msg.content}
                  {msg.note && (
                    <p className="text-xs mt-1 opacity-60 italic">{msg.note}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#2D6A2D] flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 bg-[#2D6A2D] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (show when no user messages yet) */}
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="px-3 pb-2 shrink-0 bg-gray-50">
              <p className="text-xs text-gray-400 mb-2 font-medium">{t('ai.suggestionsTitle', { defaultValue: 'Suggested questions' })}</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 4).map((s) => (
                  <button key={s} onClick={() => void sendMessage(s)}
                    className="text-xs bg-[#FAF3E0] text-[#2D6A2D] border border-[#2D6A2D]/20 px-2.5 py-1 rounded-full hover:bg-[#2D6A2D] hover:text-white transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2 shrink-0 bg-white rounded-b-2xl">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A2D]"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[#2D6A2D] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#245424] transition-colors">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
