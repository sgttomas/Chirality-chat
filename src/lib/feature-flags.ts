import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FeatureFlags {
  useGraphQL: boolean
  enableMatrixVisualization: boolean
  enableMCPIntegration: boolean
  enableAdvancedAnalytics: boolean
  debugMode: boolean
}

interface FeatureFlagsStore {
  flags: FeatureFlags
  updateFlag: (key: keyof FeatureFlags, value: boolean) => void
  resetFlags: () => void
}

const defaultFlags: FeatureFlags = {
  useGraphQL: false,           // Default to REST API
  enableMatrixVisualization: true,
  enableMCPIntegration: true, // Phase 4 feature - now enabled
  enableAdvancedAnalytics: false,
  debugMode: process.env.NODE_ENV === 'development',
}

export const useFeatureFlags = create<FeatureFlagsStore>()(
  persist(
    (set) => ({
      flags: defaultFlags,
      updateFlag: (key, value) =>
        set((state) => ({
          flags: {
            ...state.flags,
            [key]: value,
          },
        })),
      resetFlags: () => set({ flags: defaultFlags }),
    }),
    {
      name: 'chirality-feature-flags',
    }
  )
)