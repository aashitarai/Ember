import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader, ArrowRight, Download, RefreshCw, Send } from 'lucide-react'
import { BigPetView } from '../pet/PetWidget'
import { openRouterChat } from '../../core/openrouter'
import { getOpenRouterKey } from '../../core/env'
import { useAuth } from '../../core/auth'
import {
  loadTalkReport,
  saveTalkReport,
  clearTalkReport,
  setCommitmentUsesTalkReport,
  type TalkReportPayload,
} from '../../core/talkReportStorage'

// --- TYPES & DATA ---
type ConversationState = 'idle' | 'speaking' | 'listening' | 'processing' | 'error' | 'done'
type EmotionTag = { tag: string; color: string; id: 'anxious' | 'optimistic' | 'avoidant' | 'uncertain' }

const QUESTIONS = [
  "Before we talk numbers—how are you feeling about your finances right now? Anxious, hopeful, overwhelmed, or somewhere in between?",
  "Growing up, what was the unspoken rule about money in your house?",
  "When you check your balance, what's the first feeling that lands—before you even see the number?",
  "What's one purchase you made recently that you'd defend to a friend but secretly question when you're alone?",
  "What's your average monthly spending, and do you feel in control of it or does it feel like it controls you?",
  "Is there a financial decision you've been putting off—something that weighs on you but you haven't acted on yet?",
  "What does financial freedom mean to you personally—security, travel, retiring early, or something else?",
  "A year from now, you open this app and feel... different. What's different?"
]

function analyzeEmotion(text: string): EmotionTag {
  const t = text.toLowerCase()
  if (t.match(/(anxious|scared|dread|worried|fear|overwhelmed|bad|stress|panic|tight)/)) 
      return { tag: 'Anxious', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', id: 'anxious' }
  if (t.match(/(hopeful|good|excited|optimistic|great|free|peace|calm|control)/)) 
      return { tag: 'Optimistic', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', id: 'optimistic' }
  if (t.match(/(avoid|ignore|don't know|unsure|maybe|put off|later|hide)/)) 
      return { tag: 'Avoidant', color: 'text-zinc-400 border-zinc-500/30 bg-[#0a0c10]0/10', id: 'avoidant' }
  return { tag: 'Uncertain', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', id: 'uncertain' }
}

function fallbackAckLine(tag: EmotionTag): string {
  if (tag.id === 'anxious') return 'That sounds heavy—thanks for trusting me with it.'
  if (tag.id === 'optimistic') return 'I love how clearly you put that.'
  if (tag.id === 'avoidant') return 'That’s okay—we can take it at your pace.'
  return 'I’m with you—thanks for being honest.'
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(fallback), ms)
    promise
      .then((v) => {
        window.clearTimeout(t)
        resolve(v)
      })
      .catch(() => {
        window.clearTimeout(t)
        resolve(fallback)
      })
  })
}

async function fetchAckLine(question: string, answer: string, tag: EmotionTag): Promise<string> {
  const fb = fallbackAckLine(tag)
  if (!getOpenRouterKey()) return fb
  try {
    const raw = await withTimeout(
      openRouterChat({
        messages: [
        {
          role: 'system',
          content:
            'You are Ember, a calm female-presenting financial wellness guide. Reply with exactly ONE short sentence, max 20 words. Warm, specific to their words. No questions. No quote marks. No lists or emojis.',
        },
        {
          role: 'user',
          content: `Question:\n${question}\n\nTheir answer:\n${answer}\n\nOne sentence reply only:`,
        },
      ],
        temperature: 0.55,
      }),
      12_000,
      fb,
    )
    const cleaned = raw
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .split(/\n/)[0]
      .trim()
    const oneSentence = cleaned.split(/[.!?]\s+/)[0]?.trim() || cleaned
    return (oneSentence || fallbackAckLine(tag)).slice(0, 180)
  } catch {
    return fallbackAckLine(tag)
  }
}

/** Wait until the browser is actually done outputting TTS (onend can fire early). */
function afterSpeechSynthIdle(onDone: () => void) {
  const syn = window.speechSynthesis
  const started = performance.now()
  const maxMs = 90_000
  let stableFrames = 0
  const needStable = 4

  const tick = () => {
    if (!syn.speaking && !syn.pending) {
      stableFrames++
      if (stableFrames >= needStable) {
        window.setTimeout(onDone, 220)
        return
      }
    } else {
      stableFrames = 0
    }
    if (performance.now() - started > maxMs) {
      onDone()
      return
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function playSoftChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2)
    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  } catch (e) {}
}

const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition

// --- COMPONENTS ---
export function TalkPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reportRefresh, setReportRefresh] = useState(0)

  const [state, setState] = useState<ConversationState>('idle')
  const [qIndex, setQIndex] = useState(-2) // -2: Not started, -1: Intro, 0-7: Qs, 8: Done
  const [answers, setAnswers] = useState<{q: string, a: string, tag: EmotionTag}[]>([])
  const [transcript, setTranscript] = useState('')
  const [fallbackMode, setFallbackMode] = useState(false)
  const [micVol, setMicVol] = useState(0)

  const recRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const answersRef = useRef(answers)
  const ttsVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const submitBusyRef = useRef(false)
  const qIndexRef = useRef(qIndex)
  const [nextHint, setNextHint] = useState<string | null>(null)
  /** Voice mode only: Ember’s one-line reply shown in orange under the question while TTS plays. */
  const [spokenAck, setSpokenAck] = useState<string | null>(null)
  const rafRef = useRef<number>(0)

  const pickTtsVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (ttsVoiceRef.current) return ttsVoiceRef.current
    const voices = window.speechSynthesis.getVoices()
    const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
    const female =
      en.find((v) =>
        /zira|samantha|victoria|karen|aria|susan|moira|fiona|female|woman|jenny|nova|allison/i.test(
          v.name + (v as any).voiceURI,
        ),
      ) || en[0]
    ttsVoiceRef.current = female || null
    return ttsVoiceRef.current
  }, [])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    qIndexRef.current = qIndex
  }, [qIndex])

  // Waveform: avoid getUserMedia here — it fights Web Speech API for the same mic. Fake motion while listening.
  useEffect(() => {
    if (state === 'listening' && !fallbackMode) {
      const t0 = performance.now()
      const tick = () => {
        const t = (performance.now() - t0) / 1000
        setMicVol(22 + 18 * Math.sin(t * 2.8) + 12 * Math.sin(t * 6.1))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
      return () => cancelAnimationFrame(rafRef.current)
    }
    cancelAnimationFrame(rafRef.current)
    setMicVol(0)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, fallbackMode])

  // Speech API check only — a fresh Recognition instance is created each listening phase (see safeStartRecognition).
  useEffect(() => {
    if (!SpeechRecognitionAPI) setFallbackMode(true)
    return () => {
      try {
        recRef.current?.stop()
      } catch {
        /* ignore */
      }
      recRef.current = null
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
  }, [])

  const speakText = (text: string, onFinish: () => void) => {
    setState('speaking')
    window.speechSynthesis.cancel() // clear queue
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickTtsVoice()
    u.voice = voice
    u.pitch = 1.02
    u.rate = 1.05

    let handedOff = false
    const runFinish = () => {
      if (handedOff) return
      handedOff = true
      window.clearTimeout(fallbackTimer)
      afterSpeechSynthIdle(onFinish)
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length
    // Safety net only: long enough that normal TTS almost never hits it before real end-of-speech.
    const fallbackMs = Math.min(120_000, Math.max(20_000, wordCount * 550 + 8000))
    const fallbackTimer = window.setTimeout(runFinish, fallbackMs)

    u.onend = runFinish
    u.onerror = (ev: any) => {
      // "canceled" is common when we chain utterances; still wait for idle.
      if (ev?.error === 'canceled' || ev?.error === 'interrupted') return
      runFinish()
    }

    const speak = () => {
      u.voice = pickTtsVoice()
      window.speechSynthesis.speak(u)
    }
    if (window.speechSynthesis.getVoices().length === 0) {
      const onVoices = () => {
        window.speechSynthesis.onvoiceschanged = null as any
        speak()
      }
      window.speechSynthesis.onvoiceschanged = onVoices
    } else {
      speak()
    }
  }

  /** New Recognition per question avoids stuck restarts; delay reduces overlap with TTS handoff. */
  const safeStartRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || fallbackMode) return
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null

    transcriptRef.current = ''
    setTranscript('')

    const rec = new SpeechRecognitionAPI()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = (navigator.language || 'en-US').replace('_', '-')
    rec.onresult = (e: any) => {
      let line = ''
      for (let i = 0; i < e.results.length; i++) line += e.results[i][0].transcript
      transcriptRef.current = line
      setTranscript(line)
    }
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      console.warn('Speech Error', e)
      setFallbackMode(true)
      setState('error')
    }
    recRef.current = rec

    window.setTimeout(() => {
      try {
        rec.start()
      } catch {
        window.setTimeout(() => {
          try {
            rec.start()
          } catch {
            setFallbackMode(true)
            setState('error')
          }
        }, 350)
      }
    }, 420)
  }, [fallbackMode])

  const startFlow = () => {
    setQIndex(-1)
    setAnswers([])
    answersRef.current = []
    setTranscript('')
    transcriptRef.current = ''
    
    if (!fallbackMode && window.speechSynthesis) {
      const intro = "I'm Ember. I'm here to listen—not to judge. Let's begin."
      speakText(intro, () => {
        window.setTimeout(() => goToQuestion(0), 420)
      })
    } else {
      setFallbackMode(true)
      goToQuestion(0)
    }
  }

  const goToQuestion = (idx: number) => {
    setTranscript('')
    transcriptRef.current = ''
    setQIndex(idx)
    
    if (idx >= QUESTIONS.length) {
      setState('done')
      return
    }

    const q = QUESTIONS[idx]
    if (!fallbackMode) {
      setSpokenAck(null)
      speakText(q, () => {
        submitBusyRef.current = false
        setNextHint(null)
        setState('listening')
        safeStartRecognition()
      })
    } else {
      setState('idle')
    }
  }

  const submitAnswer = async (txt: string) => {
    const idx = qIndexRef.current
    const trimmed = txt.trim()
    if (!trimmed || idx < 0 || idx >= QUESTIONS.length) return
    if (submitBusyRef.current) return
    submitBusyRef.current = true
    setNextHint(null)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null

    setState('processing')
    try {
      const tag = analyzeEmotion(trimmed)
      const row = { q: QUESTIONS[idx], a: trimmed, tag }
      const nextAnswers = [...answersRef.current, row]
      answersRef.current = nextAnswers
      setAnswers(nextAnswers)

      const ack = await fetchAckLine(QUESTIONS[idx], trimmed, tag)
      if (!fallbackMode) setSpokenAck(ack)

      const nextIdx = idx + 1
      const finishOrContinue = () => {
        submitBusyRef.current = false
        if (!fallbackMode) setSpokenAck(null)
        if (nextIdx >= QUESTIONS.length) {
          setQIndex(QUESTIONS.length)
          setState('done')
          saveToStorage(nextAnswers)
          return
        }
        goToQuestion(nextIdx)
      }

      playSoftChime()
      if (!fallbackMode) {
        speakText(ack, () => window.setTimeout(finishOrContinue, 320))
      } else {
        window.setTimeout(finishOrContinue, 200)
      }
    } catch {
      submitBusyRef.current = false
      setState('listening')
      safeStartRecognition()
    }
  }

  const saveToStorage = (rows?: { q: string; a: string; tag: EmotionTag }[]) => {
    const source = rows ?? answers
    // Determine dominant emotion
    const counts = { anxious: 0, optimistic: 0, avoidant: 0, uncertain: 0 }
    source.forEach(a => { if (a && a.tag) counts[a.tag.id]++ })
    const dominant = Object.keys(counts).reduce((a, b) => counts[a as keyof typeof counts] > counts[b as keyof typeof counts] ? a : b) as any

    const scripts: any = {
      anxious: "You operate from scarcity and fear of lack.",
      optimistic: "You use money as an active tool for growth.",
      avoidant: "You avoid looking directly at your financial reality.",
      uncertain: "You are seeking clear structural boundaries."
    }

    const animals: any = {
      anxious: "Deer—gentle, alert, seeks safety. Thrives when you feel secure.",
      optimistic: "Fox—cunning, quick, explores. Thrives when actively hunting goals.",
      avoidant: "Owl—observant from afar. Needs perspective to swoop down safely.",
      uncertain: "Wolf—pack-oriented. Requires structure and loyalty to a plan."
    }

    const payload: TalkReportPayload = {
      timestamp: new Date().toISOString(),
      answers: source,
      dominantEmotion: dominant,
      moneyScript: scripts[dominant],
      recommendedAnimal: animals[dominant],
      vaultDefaults: { suggestedStake: dominant === 'optimistic' ? 500 : 50, suggestedDays: dominant === 'avoidant' ? 14 : 30 },
    }
    saveTalkReport(user?.id, payload)
    setReportRefresh((n) => n + 1)
  }

  const cancelAndRestart = () => {
    if (window.confirm("Restart the conversation? Your saved Talk report will be removed so you can start fresh.")) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      recRef.current?.stop()
      window.speechSynthesis.cancel()
      submitBusyRef.current = false
      setAnswers([])
      answersRef.current = []
      clearTalkReport(user?.id)
      setCommitmentUsesTalkReport(user?.id, false)
      setQIndex(-2)
      setState('idle')
      setSpokenAck(null)
      setReportRefresh((n) => n + 1)
    }
  }

  /** Typing-only path: skip voice intro; question 0 on screen with input ready. */
  const startTypingFlow = () => {
    setFallbackMode(true)
    setQIndex(0)
    setAnswers([])
    answersRef.current = []
    setTranscript('')
    transcriptRef.current = ''
    setNextHint(null)
    setSpokenAck(null)
    submitBusyRef.current = false
    setState('idle')
  }

  // Visuals computation
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isProcessing = state === 'processing'
  const isError = state === 'error'

  const savedReportOnIntro = useMemo(
    () => (qIndex === -2 ? loadTalkReport(user?.id) : null),
    [qIndex, user?.id, reportRefresh],
  )

  const pfpData = useMemo(
    () => (qIndex === 8 ? loadTalkReport(user?.id) : null),
    [qIndex, user?.id, reportRefresh],
  )

  return (
    <div className="relative min-h-[90vh] w-full pb-32">
      {/* Background Fox Context. Slow rotation, deeply transparent */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.05] filter blur-sm mix-blend-screen transition-opacity duration-1000">
         <BigPetView />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-12">
        
        {/* Intro Screen */}
        {qIndex === -2 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-1000">
            <h1 className="text-4xl md:text-5xl font-bold text-[#fafafa] tracking-tight">The Confession</h1>
            <p className="text-lg text-zinc-400 max-w-md">Ember will guide you through 8 questions to decode your emotional money script. Find a quiet place.</p>
            <p className="text-sm text-zinc-500">
              <Link to="/dashboard" className="text-orange-400 hover:text-orange-300 font-medium">
                Discipline dashboard
              </Link>
            </p>

            {savedReportOnIntro ? (
              <div className="w-full max-w-lg rounded-2xl border border-zinc-600/80 bg-zinc-900/60 p-5 text-left shadow-lg">
                <div className="text-xs font-bold uppercase tracking-wider text-orange-400">Your saved Talk report</div>
                <p className="mt-2 text-sm text-zinc-300">
                  <span className="font-semibold capitalize text-white">{savedReportOnIntro.dominantEmotion}</span>
                  {' — '}
                  {savedReportOnIntro.moneyScript}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Same account keeps this until you start a new conversation.</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setCommitmentUsesTalkReport(user?.id, true)
                      navigate('/build')
                    }}
                    className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-400"
                  >
                    Use for commitment strategy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Remove your saved Talk report now so you can start fresh?')) return
                      clearTalkReport(user?.id)
                      setCommitmentUsesTalkReport(user?.id, false)
                      setReportRefresh((n) => n + 1)
                    }}
                    className="rounded-xl border border-zinc-500 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    New conversation (clears saved report)
                  </button>
                </div>
              </div>
            ) : null}

            <button 
              onClick={startFlow}
              className="mt-8 px-8 py-4 bg-[#f97316] text-[#fafafa] rounded-full font-bold shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] hover:scale-105 transition-all duration-300"
            >
              Start Conversation
            </button>
            <button 
              type="button"
              onClick={startTypingFlow}
              className="mt-2 text-zinc-500 text-sm hover:text-white transition-colors"
            >
              Start without microphone (Typing Mode)
            </button>
          </div>
        )}

        {/* Conversation Flow */}
        {qIndex >= -1 && qIndex < 8 && (
          <div className="flex flex-col items-center w-full animate-in fade-in duration-700">
            
            {/* Waveform Visualizer */}
            <div className="w-full h-48 flex items-center justify-center relative mb-12 mt-8">
               <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.15),transparent_70%)] opacity-0 transition-opacity duration-500 ${isSpeaking ? 'opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.15),transparent_70%)]' : isProcessing ? 'opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15),transparent_70%)]' : ''}`} />
               <div className="flex items-center gap-1.5 md:gap-2 h-full z-10">
                 {[0,1,2,3,4,5,6].map((i) => {
                    // Logic for bar heights
                    let h = 'h-4'
                    let bg = 'bg-cyan-500/50'
                    if (isError) { h = 'h-1.5'; bg = 'bg-orange-500/40' }
                    else if (isProcessing) { h = i % 2===0 ? 'h-16' : 'h-8'; bg = 'bg-orange-400 animate-pulse' }
                    else if (isSpeaking) { 
                      const heights = ['h-8','h-16','h-24','h-16','h-32','h-12','h-6']
                      h = heights[i]; bg = 'bg-cyan-400 animate-[pulse_0.8s_ease-in-out_infinite]' 
                    }
                    else if (isListening) {
                      // React mapped strictly to mic volume
                      const activeH = Math.max(8, Math.min(100, micVol * (i === 3 ? 1.5 : 1) * 1.2))
                      h = isNaN(activeH) ? 'h-6' : `h-[${activeH}px]` // Tailwind arbitrary value won't interpolate well directly, using style instead
                      bg = 'bg-[#f97316]/80'
                    } else {
                      // Idle gentle breathing
                      h = i === 3 ? 'h-8' : (i===2||i===4) ? 'h-6' : 'h-4'
                      bg = 'bg-cyan-500/30'
                    }

                    return (
                      <div 
                        key={i}
                        style={{ height: isListening ? Math.max(16, (micVol * 1.5)) + 'px' : undefined }}
                        className={`w-2 md:w-3 rounded-full transition-all duration-300 ${bg} ${!isListening ? h : ''}`}
                      />
                    )
                 })}
               </div>
            </div>

            {/* Content Area */}
            <div className="w-full min-h-[120px] text-center mb-8">
              {qIndex === -1 ? (
                 <p className="text-xl md:text-2xl text-zinc-300 font-medium tracking-wide animate-pulse">
                   "I'm Ember. I'm here to listen—not to judge. Take a breath. We'll begin when you're ready."
                 </p>
              ) : (
                 <div className="space-y-6">
                   <h2 className="text-xl md:text-2xl font-semibold text-[#00d4ff] tracking-tight transition-all">
                     "{QUESTIONS[qIndex]}"
                   </h2>

                   {!fallbackMode && spokenAck && qIndex >= 0 && (isProcessing || isSpeaking) ? (
                     <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-orange-400">
                       {spokenAck}
                     </p>
                   ) : null}
                   
                   {/* Typing mode only: same questions, type answers, Send or Next question! (Enter sends). */}
                   {fallbackMode && qIndex >= 0 && (
                     <div className="flex flex-col gap-3">
                       <textarea 
                         disabled={state === 'processing'}
                         value={transcript}
                         onChange={(e) => setTranscript(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault()
                             const t = transcript.trim()
                             if (t && state !== 'processing') void submitAnswer(t)
                           }
                         }}
                         placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                         className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-4 text-zinc-100 min-h-[120px] outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all resize-none disabled:opacity-50"
                       />
                       <div className="flex flex-wrap items-center justify-end gap-2">
                         <button
                           type="button"
                           onClick={() => {
                             const t = transcript.trim()
                             if (!t || state === 'processing') return
                             void submitAnswer(t)
                           }}
                           disabled={!transcript.trim() || state === 'processing'}
                           className="rounded-full border border-zinc-600 bg-zinc-800/80 px-5 py-2 text-sm font-semibold text-zinc-100 transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                         >
                           Next question!
                         </button>
                         <button 
                           type="button"
                           onClick={() => {
                             const t = transcript.trim()
                             if (!t || state === 'processing') return
                             void submitAnswer(t)
                           }}
                           disabled={!transcript.trim() || state === 'processing'}
                           className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition-all hover:bg-orange-400 disabled:opacity-50 disabled:hover:bg-orange-500"
                         >
                           {state === 'processing' ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                           Send
                         </button>
                       </div>
                       <p className="text-left text-xs text-zinc-500">Same flow as voice: after each answer, Ember replies briefly, then the next question appears.</p>
                     </div>
                   )}

                   {/* Voice Transcribing Display */}
                   {!fallbackMode && isListening && (
                     <div className="space-y-4">
                       <div className="text-lg text-zinc-400 min-h-[40px] italic">
                         {transcript || "Listening..."}
                       </div>
                       {nextHint ? (
                         <p className="text-sm text-orange-400/90">{nextHint}</p>
                       ) : null}
                       <button
                         type="button"
                         onClick={() => {
                           const t = (transcriptRef.current || transcript).trim()
                           if (!t) {
                             setNextHint('No speech detected yet — speak a few words, or use “Typing Mode” on the start screen.')
                             window.setTimeout(() => setNextHint(null), 5000)
                             return
                           }
                           void submitAnswer(t)
                         }}
                         className="mx-auto block rounded-full bg-[#f97316]/90 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all hover:bg-[#ea580c]"
                       >
                         Next question!
                       </button>
                       <p className="text-xs text-zinc-500">When you’re done speaking, tap Next question! to continue.</p>
                     </div>
                   )}
                   {!fallbackMode && isProcessing && (
                     <div className="text-lg text-orange-400/80 min-h-[40px] flex items-center justify-center gap-2">
                       <Loader className="w-4 h-4 animate-spin" /> Processing...
                     </div>
                   )}
                 </div>
              )}
            </div>

            {/* Restart Sub-nav */}
            <button onClick={cancelAndRestart} className="mt-12 text-xs text-zinc-200 hover:text-zinc-400 tracking-widest uppercase transition-colors">
              Abort Sequence
            </button>
          </div>
        )}

        {/* OUTPUT CARD: Financial Snapshot */}
        {qIndex === 8 && pfpData && (
          <div className="w-full animate-in slide-in-from-bottom-12 fade-in duration-700 pb-16">
            
            <div className="bg-[#0f1115] border border-[#00d4ff]/30 rounded-[16px] shadow-[0_0_50px_rgba(0,212,255,0.05)] overflow-hidden">
               {/* 4.1 Header */}
               <div className="p-8 border-b border-zinc-800 bg-[#12151a]">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="text-2xl">🔥</span>
                     <h2 className="text-2xl font-bold text-white tracking-tight">Your Financial Snapshot</h2>
                  </div>
                  <p className="text-[#fafafa] text-lg leading-relaxed font-light">
                     {pfpData.moneyScript}
                  </p>
               </div>

               {/* Emotional Distribution Summary (Donut & Pills) */}
               <div className="p-8 bg-[#0a0c0f] border-b border-zinc-800 flex flex-col md:flex-row gap-8 items-center justify-between">
                  <div className="flex-1">
                     <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4 font-bold">Emotional Blueprint</h3>
                     <div className="flex flex-wrap gap-2">
                        {pfpData.answers.map((a: any, i: number) => (
                           <span key={i} className={`px-3 py-1 text-xs border rounded-full font-medium ${a.tag.color}`}>
                             {a.tag.tag}
                           </span>
                        ))}
                     </div>
                     <div className="mt-6 flex bg-[#161920] rounded-xl p-4 items-center gap-4 border border-zinc-800">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">🦊</div>
                        <div>
                           <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Recommended Companion</div>
                           <div className="text-sm text-zinc-300">{pfpData.recommendedAnimal}</div>
                        </div>
                     </div>
                  </div>
                  
                  {/* CSS ONLY Donut Chart Approximation */}
                  <div className="w-32 h-32 relative flex-shrink-0">
                     <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Background ring */}
                        <path className="text-white" strokeWidth="3" stroke="currentColor" fill="none"
                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        
                        {/* Highlight ring - representing dominant stat */}
                        <path className={`stroke-current ${
                            pfpData.dominantEmotion === 'anxious' ? 'text-orange-500' : 
                            pfpData.dominantEmotion === 'optimistic' ? 'text-cyan-500' : 
                            pfpData.dominantEmotion === 'avoidant' ? 'text-zinc-500' : 'text-yellow-500'
                          }`}
                          strokeWidth="3" strokeDasharray="60, 100" strokeLinecap="round" fill="none"
                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Dominant</span>
                        <span className="text-white text-sm font-bold capitalize">{pfpData.dominantEmotion}</span>
                     </div>
                  </div>
               </div>

               {/* 4.2 Q&A Pairs */}
               <div className="max-h-[300px] overflow-y-auto w-full custom-scroll">
                  {pfpData.answers.map((item: any, i: number) => (
                    <div key={i} className={`p-6 ${i % 2 === 0 ? 'bg-[#0a0c10]/[0.02]' : 'bg-transparent'} border-b border-zinc-800/50 last:border-0`}>
                       <div className="text-[10px] font-black uppercase text-[#00d4ff] tracking-[0.15em] mb-2 font-mono">
                          {i+1}. {item.q.split(' ').slice(0, 3).join(' ').replace(/[^a-zA-Z ]/g, "")}...
                       </div>
                       <p className="text-[#fafafa] text-sm leading-relaxed">
                          {item.a.length > 150 ? (
                             <span>{item.a.substring(0, 150)}... <span className="text-zinc-500 italic text-xs ml-1 cursor-pointer hover:text-white">Read more</span></span>
                          ) : item.a}
                       </p>
                    </div>
                  ))}
               </div>

            </div>

            {/* 4.4 CTA Buttons */}
            <div className="mt-8 space-y-4">
               <button
                 type="button"
                 onClick={() => {
                   setCommitmentUsesTalkReport(user?.id, true)
                   navigate('/build')
                 }}
                 className="w-full flex items-center justify-center gap-2 border-2 border-orange-400/60 bg-orange-500/15 text-orange-100 py-4 rounded-xl font-bold hover:bg-orange-500/25 transition-colors"
               >
                 Use this report for commitment strategy <ArrowRight className="w-5 h-5" />
               </button>

               <button 
                 type="button"
                 onClick={() => navigate('/vault')}
                 className="w-full flex items-center justify-center gap-2 bg-[#f97316] text-white py-4 rounded-xl font-bold hover:bg-[#ea580c] transition-colors shadow-[0_0_20px_rgba(249,115,22,0.2)]"
               >
                 Build My Vault Strategy <ArrowRight className="w-5 h-5" />
               </button>
               
               <div className="flex gap-4">
                 <button 
                   type="button"
                   onClick={() => {
                     const blob = new Blob([JSON.stringify(pfpData, null, 2)], { type: 'application/json' })
                     const url = URL.createObjectURL(blob)
                     const a = document.createElement('a')
                     a.href = url
                     a.download = 'ember_confession.json'
                     a.click()
                   }}
                   className="flex-1 flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                 >
                   <Download className="w-4 h-4" /> Download Summary
                 </button>

                 <button 
                   type="button"
                   onClick={cancelAndRestart}
                   className="flex-1 flex items-center justify-center gap-2 border border-zinc-800 bg-transparent text-zinc-400 py-3 rounded-xl text-sm font-medium hover:text-white hover:border-zinc-600 transition-colors"
                 >
                   <RefreshCw className="w-4 h-4" /> New conversation
                 </button>
               </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
