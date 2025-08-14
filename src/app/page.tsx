import { ChatWindow } from '@/components/chat'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
        <ChatWindow />
      </div>
    </main>
  )
}