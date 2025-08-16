declare global {
  interface Window {
    initializeAccessibility?: () => void
  }
}

export {}