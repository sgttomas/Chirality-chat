import Link from 'next/link'
import { ChatWindow } from '@/components/chat'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chirality Chat</h1>
              <p className="text-sm text-gray-600">AI-Powered Semantic Framework Interface</p>
            </div>
            
            <nav className="flex space-x-4">
              <Link 
                href="/chirality"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                🧬 Chirality Framework
              </Link>
              <Link 
                href="/enhanced-dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                🚀 Enhanced Dashboard
              </Link>
              <Link 
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                📊 Dashboard
              </Link>
              <Link 
                href="/matrix"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                🔢 Matrix View
              </Link>
              <Link 
                href="/mcp"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                🤖 MCP Tools
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <main className="p-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
          <ChatWindow />
        </div>
      </main>
    </div>
  )
}