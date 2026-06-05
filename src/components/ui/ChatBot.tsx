'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }

const WELCOME: Message = {
  role: 'assistant',
  content: "Bienvenue chez The Canteen's. Je suis votre assistant — posez-moi toutes vos questions sur notre menu, nos espaces, la Game Room ou pour organiser une réservation.",
}

export default function ChatBot({ locale }: { locale: string }) {
  const isEn = locale === 'en'
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus sur l'input quand on ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Erreur réseau')

      // Lecture du stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }
    } catch {
      setLoading(false)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: isEn
          ? "I'm sorry, a technical error occurred. Please contact us on WhatsApp: +237 655 867 084"
          : "Désolé, une erreur technique est survenue. Contactez-nous sur WhatsApp : +237 655 867 084" },
      ])
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
        className={cn(
          'fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-full border border-tc-gold/40 bg-tc-black px-4 py-3 text-sm font-medium text-tc-cream shadow-[0_0_20px_rgba(212,175,55,0.2)] backdrop-blur-md transition-all hover:border-tc-gold/70 hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]',
          open && 'pointer-events-none opacity-0',
        )}
        aria-label="Ouvrir l'assistant"
      >
        <MessageCircle size={18} className="text-tc-gold" />
        <span className="hidden sm:inline">
          {isEn ? 'Assistant' : 'Assistant'}
        </span>
      </motion.button>

      {/* Panneau chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-[100] flex w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl sm:w-96"
            style={{ maxHeight: '75vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-tc-gold/30 bg-tc-gold/10">
                  <MessageCircle size={15} className="text-tc-gold" />
                </div>
                <div>
                  <p className="text-xs font-medium text-tc-cream">The Canteen&apos;s</p>
                  <p className="text-[10px] text-white/30">
                    {isEn ? 'Virtual Assistant' : 'Assistant virtuel'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition hover:bg-white/5 hover:text-white/60"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-tc-gold/15 text-tc-cream'
                        : 'rounded-bl-sm bg-white/[0.05] text-tc-cream/90',
                    )}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-1.5 text-white/30">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-[11px]">
                          {isEn ? 'Typing…' : 'En train d\'écrire…'}
                        </span>
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Indicateur de chargement */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-tc-gold/50"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions rapides (seulement au début) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {(isEn
                  ? ['View the menu', 'Game Room prices', 'Make a reservation']
                  : ['Voir le menu', 'Prix Game Room', 'Faire une réservation']
                ).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50 transition hover:border-tc-gold/30 hover:text-tc-cream"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/[0.07] px-3 py-3">
              <form
                onSubmit={(e) => { e.preventDefault(); void send() }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={isEn ? 'Ask a question…' : 'Posez une question…'}
                  className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] text-tc-cream placeholder:text-white/25 outline-none focus:border-tc-gold/30 transition"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tc-gold transition hover:bg-tc-gold/80 disabled:opacity-30"
                  aria-label="Envoyer"
                >
                  <Send size={14} className="text-tc-black" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
