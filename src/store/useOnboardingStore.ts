import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface OnboardingState {
  done: boolean
  active: boolean
  step: number
  setDone: (done: boolean, userId?: string) => void
  startTour: () => void
  nextStep: () => void
  skipTour: (userId?: string) => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  done: false,
  active: false,
  step: 0,

  setDone: (done, userId) => {
    set({ done })
    if (userId) {
      supabase.from('user_profiles').upsert({ user_id: userId, onboarding_done: done }, { onConflict: 'user_id' })
    }
  },

  startTour: () => set({ active: true, step: 0 }),

  nextStep: () => set((s) => {
    if (s.step < 3) return { step: s.step + 1 }
    return { active: false, done: true }
  }),

  skipTour: (userId) => {
    set({ active: false, done: true })
    if (userId) {
      supabase.from('user_profiles').upsert({ user_id: userId, onboarding_done: true }, { onConflict: 'user_id' })
    }
  },
}))
