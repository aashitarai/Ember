import { useCallback, useState } from 'react'

// Simple Sound Engine Singleton that creates Audio objects lazily
// Expects assets to be placed in /public/sounds/ later.
const SOUNDS = {
  stake: '/sounds/cha-ching.mp3',
  upgrade: '/sounds/orchestral-swell.mp3',
  complete: '/sounds/chime.mp3'
}

type SoundEffect = keyof typeof SOUNDS;

// Global mute state
let isMuted = false;

export function useSoundEffect() {
  const [muted, setMuted] = useState(isMuted)

  const toggleMute = useCallback(() => {
    isMuted = !isMuted;
    setMuted(isMuted);
  }, [])

  const playSound = useCallback((effect: SoundEffect) => {
    if (isMuted) return;
    try {
      const audio = new Audio(SOUNDS[effect]);
      audio.volume = 0.5; // keep it subtle
      audio.play().catch(() => {
        // Audio play might be blocked by browser policy without user interaction.
        // Silently fail as this is just UX polish.
      });
    } catch {}
  }, [])

  return { playSound, muted, toggleMute }
}
