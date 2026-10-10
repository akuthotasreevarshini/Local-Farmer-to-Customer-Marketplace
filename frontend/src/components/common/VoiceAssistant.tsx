import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, X, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

// SpeechRecognition browser types
type SpeechRecognitionAPI = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

const VOICE_LANGS = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'hi-IN', label: 'हिन्दी' },
]

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as SpeechRecognitionAPI
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}


interface VoiceAssistantProps {
  onSearch?: (text: string) => void
  onAsk?: (text: string) => void
  lastSpokenText?: string
}

export default function VoiceAssistant({ onSearch, onAsk, lastSpokenText }: VoiceAssistantProps) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isSupported = Boolean(getSpeechRecognition())

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    stopSpeaking()
    setIsSpeaking(true)
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = voiceLang
    utt.rate = 0.9
    utt.onend = () => setIsSpeaking(false)
    utt.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [voiceLang, stopSpeaking])

  // Replay last spoken text
  useEffect(() => {
    if (lastSpokenText) speakText(lastSpokenText)
  }, [lastSpokenText, speakText])

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()
    // Navigation commands
    if (/go to (home|homepage)/.test(lower) || /home page/.test(lower)) { navigate('/'); speakText('Going to home page'); return }
    if (/go to (shop|products|marketplace)/.test(lower) || lower.includes('open shop')) { navigate('/products'); speakText('Opening shop'); return }
    if (/go to cart|open cart|shopping cart/.test(lower)) { navigate('/cart'); speakText('Opening cart'); return }
    if (/compare|price comparison/.test(lower)) { navigate('/compare'); speakText('Opening price comparison'); return }
    if (/group buy/.test(lower)) { navigate('/group-buys'); speakText('Opening group buys'); return }
    if (/nearby farmer|map|find farmer/.test(lower)) { navigate('/map'); speakText('Opening nearby farmers map'); return }
    if (/login|sign in/.test(lower)) { navigate('/login'); speakText('Going to login'); return }
    if (/register|sign up|create account/.test(lower)) { navigate('/register'); speakText('Going to registration'); return }
    // Search command
    if (lower.startsWith('search') || lower.startsWith('find') || lower.startsWith('look for')) {
      const query = text.replace(/^(search|find|look for)\s*/i, '')
      if (onSearch) { onSearch(query); speakText(`Searching for ${query}`); navigate(`/products?search=${encodeURIComponent(query)}`); return }
    }
    // Ask AI assistant
    if (onAsk) { onAsk(text); speakText('Let me find that for you.') }
  }, [navigate, onSearch, onAsk, speakText])

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) { setError(t('voice.notSupported')); return }

    setError(null); setTranscript(''); setListening(true)

    const rec = new SpeechRecognition()
    rec.lang = voiceLang
    rec.continuous = false
    rec.interimResults = true
    recognitionRef.current = rec

    rec.onresult = (e) => {
      const result = Array.from(e.results).map((r) => r[0]?.transcript ?? '').join('')
      setTranscript(result)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') setError(t('voice.permissionDenied'))
      else setError(`${t('common.error')}: ${e.error}`)
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      if (transcript) processCommand(transcript)
    }
    rec.start()
  }, [voiceLang, transcript, processCommand, t])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return (
    <>
      {/* Floating microphone button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-[#8B5E3C] text-white shadow-lg flex items-center justify-center hover:bg-[#7a5234] transition-all active:scale-95"
        aria-label={open ? 'Close Voice Assistant' : 'Open Voice Assistant'}
        style={{ boxShadow: '0 4px 16px rgba(139,94,60,0.4)' }}
      >
        {listening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
      </button>

      {/* Voice panel */}
      {open && (
        <div className="fixed bottom-40 right-6 z-40 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#8B5E3C] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={18} />
              <p className="font-semibold text-sm">{t('voice.title', { defaultValue: 'Voice Assistant' })}</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded"><X size={16} /></button>
          </div>

          <div className="p-4">
            {/* Language selector */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2 text-xs font-medium text-gray-600">
                <Languages size={13} />{t('voice.language', { defaultValue: 'Voice Language' })}
              </div>
              <div className="flex gap-2">
                {VOICE_LANGS.map((lang) => (
                  <button key={lang.code} onClick={() => setVoiceLang(lang.code)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex-1 ${voiceLang === lang.code ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'border-gray-200 text-gray-700 hover:border-[#8B5E3C]'}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {!isSupported ? (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">{t('voice.notSupported')}</div>
            ) : (
              <>
                {/* Big mic button */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <button
                    onClick={listening ? stopListening : startListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${listening ? 'bg-red-500 animate-pulse scale-110' : 'bg-[#8B5E3C] hover:bg-[#7a5234]'}`}
                    aria-label={listening ? t('voice.stop') : t('voice.listen')}
                  >
                    {listening ? <MicOff size={32} /> : <Mic size={32} />}
                  </button>
                  <p className="text-sm font-medium text-gray-700">
                    {listening ? t('voice.listening') : t('voice.listen')}
                  </p>
                </div>

                {/* Transcript */}
                {(transcript || listening) && (
                  <div className="bg-[#FAF3E0] rounded-xl p-3 text-sm text-gray-800 min-h-[48px] text-center">
                    {transcript || <span className="text-gray-400 italic">...</span>}
                  </div>
                )}

                {/* TTS controls */}
                <div className="flex gap-2 mt-3">
                  {isSpeaking ? (
                    <button onClick={stopSpeaking} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full bg-[#FAF3E0] text-[#8B5E3C] text-sm border border-[#8B5E3C]/30 hover:bg-[#8B5E3C] hover:text-white transition-colors">
                      <VolumeX size={16} />{t('voice.stop')}
                    </button>
                  ) : (
                    <button onClick={() => speakText(t('voice.listen'))} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full bg-[#FAF3E0] text-[#8B5E3C] text-sm border border-[#8B5E3C]/30 hover:bg-[#8B5E3C] hover:text-white transition-colors">
                      <Volume2 size={16} />{t('voice.replay', { defaultValue: 'Replay' })}
                    </button>
                  )}
                </div>

                {/* Voice commands hint */}
                <div className="mt-3 text-xs text-gray-400 space-y-1">
                  <p className="font-medium text-gray-500">Try saying:</p>
                  {['Search tomatoes', 'Go to cart', 'Compare prices', 'Nearby farmers'].map((hint) => (
                    <p key={hint} className="bg-gray-50 rounded px-2 py-1">"{hint}"</p>
                  ))}
                </div>
              </>
            )}

            {error && <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}

