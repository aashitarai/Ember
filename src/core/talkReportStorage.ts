/** Per-account Talk / PFP report + link to Commitment page. */

export type TalkReportTag = { tag: string; color: string; id: string }

export type TalkReportPayload = {
  timestamp: string
  answers: Array<{ q: string; a: string; tag: TalkReportTag }>
  dominantEmotion: string
  moneyScript: string
  recommendedAnimal: string
  vaultDefaults?: {
    suggestedStake?: number
    suggestedDays?: number
    activeCommitment?: unknown
  }
}

const LEGACY_KEY = 'ember_pfp'

function scopedKey(userId: string | null | undefined): string {
  const id = userId || 'guest'
  return `ember.talkReport.v1.${id}`
}

function linkKey(userId: string | null | undefined): string {
  const id = userId || 'guest'
  return `ember.commitment.useTalkReport.${id}`
}

export function loadTalkReport(userId: string | null | undefined): TalkReportPayload | null {
  try {
    const scoped = localStorage.getItem(scopedKey(userId))
    if (scoped) return JSON.parse(scoped) as TalkReportPayload
    const leg = localStorage.getItem(LEGACY_KEY)
    if (leg) return JSON.parse(leg) as TalkReportPayload
    return null
  } catch {
    return null
  }
}

export function saveTalkReport(userId: string | null | undefined, payload: TalkReportPayload) {
  const json = JSON.stringify(payload)
  localStorage.setItem(scopedKey(userId), json)
  localStorage.setItem(LEGACY_KEY, json)
}

export function clearTalkReport(userId: string | null | undefined) {
  localStorage.removeItem(scopedKey(userId))
  localStorage.removeItem(LEGACY_KEY)
}

export function setCommitmentUsesTalkReport(userId: string | null | undefined, use: boolean) {
  localStorage.setItem(linkKey(userId), use ? '1' : '0')
}

export function getCommitmentUsesTalkReport(userId: string | null | undefined): boolean {
  return localStorage.getItem(linkKey(userId)) === '1'
}
