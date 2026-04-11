import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type SpeechState =
  | { supported: false; listening: false; error: string | null }
  | { supported: true; listening: boolean; error: string | null }

export function useSpeechRecognition(options: {
  onText: (text: string) => void
  enabled: boolean
}) {
  const RecognitionCtor = useMemo(() => {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  }, [])

  const supported = Boolean(RecognitionCtor)
  const recRef = useRef<any>(null)
  const listeningRef = useRef(false)
  const [state, setState] = useState<SpeechState>({
    supported,
    listening: false,
    error: null,
  } as SpeechState)

  const [transcript, setTranscript] = useState('')
  const transcriptRef = useRef('')

  useEffect(() => {
    if (!supported) return
    if (!options.enabled) return
    if (recRef.current) return

    const rec = new RecognitionCtor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event: any) => {
      // Build a full transcript from results to avoid duplicate appends.
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        full += (res?.[0]?.transcript ?? '') + ' '
      }
      full = full.replace(/\s+/g, ' ').trim()
      transcriptRef.current = full
      setTranscript(full)
      if (full) options.onText(full)
    }

    rec.onerror = (e: any) => {
      listeningRef.current = false
      setState((s) => ({ ...(s as any), error: e?.error ?? 'voice_error', listening: false }))
    }

    rec.onend = () => {
      listeningRef.current = false
      setState((s) => ({ ...(s as any), listening: false }))
    }

    recRef.current = rec
  }, [RecognitionCtor, options, supported])

  const reset = useCallback(() => {
    transcriptRef.current = ''
    setTranscript('')
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    if (listeningRef.current) return
    try {
      setState((s) => ({ ...(s as any), error: null }))
      reset()
      recRef.current?.start?.()
      listeningRef.current = true
      setState((s) => ({ ...(s as any), listening: true }))
    } catch (e: any) {
      // Ignore the common "already started" issue and keep state stable.
      const msg = String(e?.message ?? '')
      if (msg.toLowerCase().includes('already started')) return
      listeningRef.current = false
      setState((s) => ({ ...(s as any), error: e?.message ?? 'voice_start_failed', listening: false }))
    }
  }, [reset, supported])

  const stop = useCallback(() => {
    if (!supported) return
    try {
      recRef.current?.stop?.()
    } finally {
      listeningRef.current = false
      setState((s) => ({ ...(s as any), listening: false }))
    }
  }, [supported])

  const toggle = useCallback(() => {
    if (!supported) return
    if (listeningRef.current) stop()
    else start()
  }, [start, stop, supported])

  useEffect(() => {
    if (!options.enabled) stop()
  }, [options.enabled, stop])

  return { ...state, transcript, reset, start, stop, toggle }
}

