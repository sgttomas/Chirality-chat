// Temperature settings for different prompt stages

export const TEMPS = {
  propose: 0.7,
  consolidate: 0.7,
  interpret: 0.5,
  finalize: 0.5,
} as const

export type TempStage = keyof typeof TEMPS