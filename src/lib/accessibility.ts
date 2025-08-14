/**
 * Accessibility utilities and ARIA helpers for chirality-chat
 */

// Keyboard navigation constants
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown'
} as const

// ARIA role constants
export const AriaRoles = {
  BUTTON: 'button',
  DIALOG: 'dialog',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  REGION: 'region',
  COMPLEMENTARY: 'complementary',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo',
  APPLICATION: 'application',
  TOOLBAR: 'toolbar',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  LISTBOX: 'listbox',
  OPTION: 'option',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel'
} as const

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  static getFocusableElements(container: Element): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors)) as HTMLElement[]
  }

  static getFirstFocusableElement(container: Element): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[0] || null
  }

  static getLastFocusableElement(container: Element): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[elements.length - 1] || null
  }

  static trapFocus(container: Element, event: KeyboardEvent): void {
    if (event.key !== KeyboardKeys.TAB) return

    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  static restoreFocus(previousActiveElement: Element | null): void {
    if (previousActiveElement && 'focus' in previousActiveElement) {
      (previousActiveElement as HTMLElement).focus()
    }
  }
}

// Screen reader utilities
export class ScreenReader {
  private static announceElement: HTMLElement | null = null

  static initialize(): void {
    if (this.announceElement) return

    this.announceElement = document.createElement('div')
    this.announceElement.setAttribute('aria-live', 'polite')
    this.announceElement.setAttribute('aria-atomic', 'true')
    this.announceElement.style.position = 'absolute'
    this.announceElement.style.left = '-10000px'
    this.announceElement.style.width = '1px'
    this.announceElement.style.height = '1px'
    this.announceElement.style.overflow = 'hidden'
    document.body.appendChild(this.announceElement)
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.initialize()
    if (!this.announceElement) return

    this.announceElement.setAttribute('aria-live', priority)
    this.announceElement.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = ''
      }
    }, 1000)
  }

  static announceProgress(current: number, total: number, task: string): void {
    const percentage = Math.round((current / total) * 100)
    this.announce(`${task}: ${percentage}% complete, ${current} of ${total}`)
  }
}

// High contrast and color utilities
export class ColorAccessibility {
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  private static getLuminance(color: string): number {
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  static meetsWCAGAA(color1: string, color2: string): boolean {
    return this.getContrastRatio(color1, color2) >= 4.5
  }

  static meetsWCAGAAA(color1: string, color2: string): boolean {
    return this.getContrastRatio(color1, color2) >= 7
  }
}

// Keyboard navigation helpers
export function createKeyboardHandler(handlers: Record<string, (event: KeyboardEvent) => void>) {
  return (event: KeyboardEvent) => {
    const handler = handlers[event.key]
    if (handler) {
      event.preventDefault()
      handler(event)
    }
  }
}

// ARIA description helpers
export function generateAriaDescription(element: {
  type?: string
  selected?: boolean
  disabled?: boolean
  expanded?: boolean
  position?: { index: number; total: number }
}): string {
  const parts: string[] = []
  
  if (element.type) {
    parts.push(element.type)
  }
  
  if (element.position) {
    parts.push(`${element.position.index} of ${element.position.total}`)
  }
  
  if (element.selected) {
    parts.push('selected')
  }
  
  if (element.disabled) {
    parts.push('disabled')
  }
  
  if (element.expanded !== undefined) {
    parts.push(element.expanded ? 'expanded' : 'collapsed')
  }
  
  return parts.join(', ')
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// High contrast detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Initialize accessibility features
export function initializeAccessibility(): void {
  // Only initialize in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  try {
    ScreenReader.initialize()
    
    // Add global keyboard navigation
    document.addEventListener('keydown', (event) => {
      // Skip navigation with Alt+Tab
      if (event.altKey && event.key === KeyboardKeys.TAB) {
        return
      }
    })
    
    // Announce page changes for screen readers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === Node.ELEMENT_NODE
          ) as Element[]
          
          for (const element of addedElements) {
            if (element.hasAttribute('data-announce')) {
              const message = element.getAttribute('data-announce')
              if (message) {
                ScreenReader.announce(message)
              }
            }
          }
        }
      })
    })
    
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    }
  } catch (error) {
    console.warn('Accessibility initialization error:', error)
  }
}