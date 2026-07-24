// ============================================================
//  音频 Store — 背景音乐控制
// ============================================================
import { create } from 'zustand';
import { STORAGE_KEYS } from '../config/storageKeys';

interface AudioState {
  bgmMuted: boolean;
  setBgmMuted: (muted: boolean) => void;
}

const AUDIO_KEY = `${STORAGE_KEYS.UI_SETTINGS}_bgm_muted`;

function loadAudioMuted(): boolean {
  try {
    return localStorage.getItem(AUDIO_KEY) === 'true';
  } catch {
    return false;
  }
}

export const useAudioStore = create<AudioState>((set) => ({
  bgmMuted: loadAudioMuted(),
  setBgmMuted: (muted) => {
    try {
      localStorage.setItem(AUDIO_KEY, String(muted));
    } catch { /* quota exceeded */ }
    set({ bgmMuted: muted });
  },
}));
