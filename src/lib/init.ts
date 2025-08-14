// Client-side initialization
export function initializeApp() {
  if (typeof window !== 'undefined') {
    console.log('Chirality Chat initializing...')
    
    // Register service worker only in production
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service worker registration failed:', err)
      })
    }
    
    // Initialize accessibility features if they exist
    if (typeof window.initializeAccessibility === 'function') {
      try {
        window.initializeAccessibility()
      } catch (err) {
        console.warn('Accessibility initialization failed:', err)
      }
    }
    
    console.log('Chirality Chat ready!')
  }
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).chiralityChat = {
    version: '1.0.0',
    initialized: false
  }
}