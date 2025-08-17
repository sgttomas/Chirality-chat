import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Chirality Chat',
  description: 'Semantic framework chat interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
