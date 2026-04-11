import { getOpenRouterKey } from './env'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function openRouterChat(options: {
  messages: ChatMessage[]
  model?: string
  signal?: AbortSignal
  temperature?: number
}): Promise<string> {
  const key = getOpenRouterKey()
  if (!key) throw new Error('Missing OpenRouter API key. Set VITE_OPENROUTER_API_KEY in .env')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'Ember',
    },
    body: JSON.stringify({
      model: options.model ?? 'openai/gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    }),
    signal: options.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`)
  }

  const data = (await res.json()) as any
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('Empty model response')
  return content.trim()
}

