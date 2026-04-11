export function getOpenRouterKey(): string | null {
  const key = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined
  return key?.trim() ? key.trim() : null
}

