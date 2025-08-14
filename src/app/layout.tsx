import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers'
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
          <QueryProvider>
            {children}
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
