import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X, Send, Rocket, Sparkles, ChevronRight } from 'lucide-react'
import { openRouterChat, type ChatMessage as ORMessage } from '../../core/openrouter'
import { getOpenRouterKey } from '../../core/env'
import { useAuth } from '../../core/auth'
import { loadTalkReport, saveTalkReport, type TalkReportPayload } from '../../core/talkReportStorage'

const GOAL_OPTIONS = ['House', 'Car', 'MBA', 'Emergency Fund', 'Startup Launch', 'Vacation', 'Wedding', 'Custom']

interface FormValues {
  goal: string
  customGoal: string
  amount: string
  days: string
  frequency: 'monthly' | 'daily'
}

type ChatMessage = { role: 'ai' | 'user'; text: string }

export function BuildPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { control, watch, setValue } = useForm<FormValues>({
    defaultValues: { goal: '', customGoal: '', amount: '', days: '', frequency: 'monthly' }
  })

  // Deep Watchers
  const goal = watch('goal')
  const customGoal = watch('customGoal')
  const amount = watch('amount')
  const days = watch('days')
  const frequency = watch('frequency')
  const wAmount = Number(amount) || 0
  const wDays = Number(days) || 0

  // State
  const [talkReport, setTalkReport] = useState<TalkReportPayload | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatDraft, setChatDraft] = useState('')
  const [isChatBusy, setIsChatBusy] = useState(false)
  const [isSavedModal, setIsSavedModal] = useState(false)
  const [finalPlanSummary, setFinalPlanSummary] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTalkReport(loadTalkReport(user?.id))
  }, [user?.id])

  // Auto scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Projection Math
  const projection = useMemo(() => {
    if (!wAmount || !wDays) return 0
    // Real math logic strictly mapping against the exact timeline
    return frequency === 'monthly' ? (wAmount * Math.ceil(wDays / 30.44)) : (wAmount * wDays)
  }, [wAmount, wDays, frequency])

  const buildCommitmentCoachSystem = useCallback((): string => {
    const goalLabel = goal === 'Custom' ? watch('customGoal') || 'custom goal' : goal || '(not selected yet)'
    const talk =
      talkReport &&
      `They completed a Talk session. Dominant emotional tone: ${talkReport.dominantEmotion}. Core script: "${talkReport.moneyScript}" Companion framing: ${talkReport.recommendedAnimal}.`
    return `You are Ember, a warm financial commitment coach (India / INR context).

Current form (may be incomplete — help them fill gaps):
- Goal: ${goalLabel}
- Amount (INR per ${frequency === 'monthly' ? 'month' : 'day'}): ${wAmount || 'not set'}
- Horizon: ${wDays || 'not set'} days
- Rough projection if numbers hold: ₹${projection.toLocaleString()}

${talk || 'No Talk report on file for this account — focus on goal clarity and habit design.'}

How to behave:
- Have a real back-and-forth: respond to what they say, then ask **one** focused follow-up (or give one concrete suggestion) so they never feel stuck.
- If they’re confused, contrast **short-term** (this week / this month) vs **long-term** (full timeline) with quick examples (e.g. “₹500/day coffee vs one extra EMI payment”).
- Comment honestly if the amount or timeline feels unrealistic; suggest a gentler ladder (smaller amount or longer horizon).
- Use short paragraphs or light bullets when helpful. No shame, no jargon walls.
- Keep going across many turns until they tap “Done chatting” — there is no fixed question count.`
  }, [goal, watch, wAmount, frequency, wDays, projection, talkReport])

  const openAiPanel = async () => {
    setChatMessages([])
    setIsChatOpen(true)
    setIsChatBusy(true)
    try {
      if (!getOpenRouterKey()) {
        setChatMessages([
          {
            role: 'ai',
            text: 'Add `VITE_OPENROUTER_API_KEY` to your `.env` file and restart `npm run dev`. Then reopen this chat — the live coach needs that key to reply.',
          },
        ])
        return
      }
      const seed = `The user just opened the commitment coach. Their fields: goal "${goal === 'Custom' ? watch('customGoal') : goal || 'unspecified'}", ₹${wAmount || '?'}/${frequency}, ${wDays || '?'} days. Open with 2–4 friendly sentences, reflect any Talk insight if relevant, and invite them to share what feels fuzzy (amount, timeline, or motivation).`
      const reply = await openRouterChat({
        messages: [
          { role: 'system', content: buildCommitmentCoachSystem() },
          { role: 'user', content: seed },
        ],
      })
      setChatMessages([{ role: 'ai', text: reply }])
    } catch (e: any) {
      setChatMessages([
        {
          role: 'ai',
          text: `Couldn’t reach the AI: ${e?.message || e}. Check your key, network, and that Vite was restarted after editing .env.`,
        },
      ])
    } finally {
      setIsChatBusy(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatDraft.trim() || isChatBusy) return
    const userText = chatDraft.trim()
    setChatDraft('')
    const newChat: ChatMessage[] = [...chatMessages, { role: 'user', text: userText }]
    setChatMessages(newChat)
    setIsChatBusy(true)
    try {
      if (!getOpenRouterKey()) {
        setChatMessages([
          ...newChat,
          { role: 'ai', text: 'OpenRouter key missing — add VITE_OPENROUTER_API_KEY to `.env` and restart the dev server.' },
        ])
        return
      }
      const msgs: ORMessage[] = [
        { role: 'system', content: buildCommitmentCoachSystem() },
        ...newChat.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text } as ORMessage)),
      ]
      const reply = await openRouterChat({ messages: msgs })
      setChatMessages([...newChat, { role: 'ai', text: reply }])
      setFinalPlanSummary((prev) => (prev ? `${prev}\n\n---\n\n${reply}` : reply))
    } catch (e: any) {
      setChatMessages([...newChat, { role: 'ai', text: `Error: ${e?.message || e}. Try again.` }])
    } finally {
      setIsChatBusy(false)
    }
  }

  const finalizeFromChat = () => {
    const lastAi = [...chatMessages].reverse().find((m) => m.role === 'ai')
    if (lastAi?.text) setFinalPlanSummary((prev) => prev || lastAi.text)
    setIsChatOpen(false)
  }

  const handleSaveCommitment = () => {
    const payload = {
      goalName: goal === 'Custom' ? watch('customGoal') : goal,
      targetAmount: wAmount,
      timelineDays: wDays,
      commitmentType: frequency,
      aiPlanSummary: finalPlanSummary,
      timestamp: Date.now(),
    }
    const existing = loadTalkReport(user?.id) as TalkReportPayload | null
    const merged: TalkReportPayload =
      existing && existing.answers
        ? {
            ...existing,
            vaultDefaults: {
              ...(existing.vaultDefaults || {}),
              suggestedStake: wAmount,
              suggestedDays: wDays,
              activeCommitment: payload,
            },
          }
        : {
            timestamp: new Date().toISOString(),
            answers: [],
            dominantEmotion: 'uncertain',
            moneyScript: 'Commitment saved from planner.',
            recommendedAnimal: 'Fox',
            vaultDefaults: { suggestedStake: wAmount, suggestedDays: wDays, activeCommitment: payload },
          }
    saveTalkReport(user?.id, merged)
    setIsSavedModal(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 relative">
      
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Commitment</h1>
        <p className="text-lg text-zinc-400 font-light">
          Pick a goal, choose timeline, and commit daily or monthly. Ember shows exactly how much you can save in a year.{' '}
          <Link to="/dashboard" className="text-orange-400 hover:text-orange-300 font-medium">
            Track discipline on the dashboard →
          </Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Data Entry */}
        <div className="lg:col-span-7 space-y-8">
          <div className="card p-6 bg-[#0a0c10] border border-zinc-800 shadow-xl space-y-6">
            
            {/* Goal Dropdown */}
            <div className="space-y-2 relative">
               <Controller
                 name="goal"
                 control={control}
                 render={({ field }) => (
                   <select {...field} className="w-full bg-[#12151a] border border-zinc-700/50 text-white p-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 appearance-none text-lg transition-all">
                     <option value="" disabled hidden>Select your goal...</option>
                     {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                 )}
               />
               <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none rotate-90" />
            </div>

            {/* Custom Goal Input conditionally rendered */}
            {goal === 'Custom' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 relative overflow-hidden">
                <Controller name="customGoal" control={control} render={({ field }) => (
                  <input {...field} placeholder="Name your specific target..." className="w-full bg-[#12151a] border border-zinc-700/50 text-white p-4 rounded-xl outline-none focus:border-orange-500/50 text-lg transition-all" />
                )} />
              </motion.div>
            )}

            {/* Target Amount & Timeline */}
            <div className="grid sm:grid-cols-2 gap-4">
               <div className="space-y-2 relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">₹</span>
                 <Controller name="amount" control={control} render={({ field }) => (
                   <input {...field} type="number" placeholder="Enter amount" className="w-full bg-[#12151a] border border-zinc-700/50 text-white p-4 pl-8 rounded-xl outline-none focus:border-orange-500/50 text-lg transition-all [&::-webkit-inner-spin-button]:appearance-none" />
                 )} />
               </div>
               
               <div className="space-y-2">
                 <Controller name="days" control={control} render={({ field }) => (
                   <input {...field} type="number" placeholder="Complete in how many days?" className="w-full bg-[#12151a] border border-zinc-700/50 text-white p-4 rounded-xl outline-none focus:border-orange-500/50 text-lg transition-all [&::-webkit-inner-spin-button]:appearance-none" />
                 )} />
               </div>
            </div>

            {/* Monthly / Daily Toggle Controls */}
            <div className="flex bg-[#12151a] p-1.5 rounded-xl border border-zinc-800">
               <button 
                 type="button" 
                 onClick={() => setValue('frequency', 'monthly')}
                 className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${frequency === 'monthly' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Monthly
               </button>
               <button 
                 type="button" 
                 onClick={() => setValue('frequency', 'daily')}
                 className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${frequency === 'daily' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Daily
               </button>
            </div>
            
          </div>

          {/* AI Motivation Injection Card */}
          {talkReport && (
            <div className="card p-6 bg-gradient-to-br from-[#0c0e12] to-[#1a1c23] border border-cyan-500/20 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.05),transparent_50%)]" />
               <h3 className="text-sm uppercase tracking-widest text-cyan-500 font-black mb-3">Why this matters to you</h3>
               <p className="text-zinc-300 leading-relaxed relative z-10 text-[15px]">
                 You operate currently from <span className="font-bold text-white capitalize">{talkReport.dominantEmotion}</span> motivations. We identified that your core script states: <span className="text-cyan-100/90 italic">"{talkReport.moneyScript}"</span>. 
                 This commitment is the exact mechanism to override that script entirely.
               </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Projection & Tracking Insights */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Display Projection */}
          <div className="card p-8 bg-[#050608] border border-orange-500/30 text-center shadow-[0_0_40px_rgba(249,115,22,0.03)] flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden group">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_70%)] opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
             
             {wAmount && wDays ? (
                <>
                  <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 z-10">
                     <span className="text-orange-500 text-4xl mr-1">₹</span>{projection.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold z-10">Projected commitment value (year-end)</div>
                  <div className="mt-4 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-200 z-10">
                     Based on {frequency} commitment of ₹{wAmount.toLocaleString()} for {wDays} days.
                  </div>
                  
                  {/* Adaptive Microcopy */}
                  <div className="absolute bottom-4 text-[10px] uppercase tracking-widest text-zinc-200 font-black">
                     {wAmount > 50000 ? "You are ambitious. Let's make it sustainable." : wDays > 100 ? "Many chances to prove yourself right." : "A perfect place to start."}
                  </div>
                </>
             ) : (
                <div className="text-zinc-200 z-10 font-bold flex flex-col items-center gap-3">
                   <span className="text-5xl">—</span>
                   <span className="text-sm">Enter details above</span>
                </div>
             )}
          </div>

          {/* Tracking Ring & Streak Mini-Widgets */}
          <div className="grid grid-cols-2 gap-4">
             <div className="card p-4 bg-[#0a0c10] border border-zinc-800 flex items-center justify-center gap-4 group cursor-help transition-colors hover:bg-[#0f1218]">
                {/* Visual SVG Ring */}
                <div className="w-12 h-12 relative flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-white" />
                     <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="125" strokeDashoffset="125" className="text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] transition-all duration-1000" />
                   </svg>
                   <span className="absolute text-[10px] font-bold text-zinc-400">0%</span>
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-zinc-500">Timeline</div>
                   <div className="text-[9px] text-zinc-200 mt-0.5 group-hover:text-orange-400 transition-colors">Start today.</div>
                </div>
             </div>

             <div className="card p-4 bg-[#0a0c10] border border-zinc-800 flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-colors group-hover:border-orange-500/50">
                   <Flame className="w-5 h-5 text-zinc-200 group-hover:text-orange-500 transition-colors" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-zinc-500">Streak</div>
                   <div className="text-sm font-bold text-zinc-300">0 Days</div>
                </div>
             </div>
          </div>

          {/* AI Trigger */}
          <button
             type="button"
             onClick={() => void openAiPanel()}
             className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-[#f97316] text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:bg-[#ea580c] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
          >
             <Sparkles className="w-4 h-4" /> Ask AI for commitment plan
          </button>

          <button
            type="button"
            disabled={!goal || !wAmount || !wDays || (goal === 'Custom' && !customGoal?.trim())}
            onClick={handleSaveCommitment}
            className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 py-4 font-bold text-orange-100 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-200"
          >
            Save commitment
          </button>
        </div>

      </div>

      {/* AI Chat Drawer via Framer Motion */}
      <AnimatePresence>
        {isChatOpen && (
           <>
             {/* Backdrop */}
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChatOpen(false)} className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm" />
             
             {/* Chat Panel */}
             <motion.div 
               initial={{ x: '100%', opacity: 0 }} 
               animate={{ x: 0, opacity: 1 }} 
               exit={{ x: '100%', opacity: 0 }} 
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 z-50 h-full w-full md:w-[500px] bg-[#0c0e12] border-l border-zinc-800 shadow-2xl flex flex-col"
             >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                   <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-500" /> Ember Planner
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Guided commitment chat</p>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll" ref={chatScrollRef}>
                   {chatMessages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-[#f97316] text-white rounded-br-sm' : 'bg-zinc-900 border border-zinc-700/50 text-zinc-200 rounded-bl-sm'}`}>
                            {msg.text.split('\n').map((line, idx) => (
                               <p key={idx} className={`${line.startsWith('-') || line.startsWith('•') ? 'ml-4' : 'mb-2 last:mb-0'}`}>{line}</p>
                            ))}
                         </div>
                      </motion.div>
                   ))}
                   {isChatBusy && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
                         <div className="bg-zinc-900 border border-zinc-700/50 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2 text-orange-400/80">
                           <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                           <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:150ms]" />
                           <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse [animation-delay:300ms]" />
                         </div>
                      </motion.div>
                   )}
                </div>

                <div className="space-y-3 border-t border-zinc-800 bg-[#0a0c10] p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void sendChatMessage()
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder="Type a message…"
                      disabled={isChatBusy}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition-colors focus:border-orange-500/50 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatDraft.trim() || isChatBusy}
                      className="flex items-center justify-center rounded-xl bg-orange-500 p-3 text-white transition-colors hover:bg-orange-400 disabled:opacity-50 disabled:hover:bg-orange-500"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={finalizeFromChat}
                    className="w-full rounded-xl border border-zinc-600 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    Done chatting — keep last coach reply as plan notes
                  </button>
                </div>
             </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* Vault Migration Modal */}
      <AnimatePresence>
        {isSavedModal && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#12151a] border border-orange-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(249,115,22,0.15)]">
                 <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                    <Rocket className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Ready to stake?</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed mb-8">This locks your goal on-chain. Your amount and timeline have been perfectly loaded into the Vault.</p>
                 <div className="space-y-3">
                   <button onClick={() => navigate('/vault')} className="w-full py-3 bg-[#f97316] text-white font-bold rounded-xl hover:bg-[#ea580c] transition-colors">
                      Enter the Vault
                   </button>
                   <button onClick={() => setIsSavedModal(false)} className="w-full py-3 bg-transparent text-zinc-500 font-medium rounded-xl hover:bg-zinc-900 transition-colors">
                      Wait, return
                   </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
