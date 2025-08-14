import { StreamMessage } from '@/hooks/useStream'

const DB_NAME = 'chirality-chat'
const DB_VERSION = 1
const STORE_NAME = 'messages'
const FALLBACK_KEY = 'chirality-chat-messages'

export interface StorageAdapter {
  saveMessage: (message: StreamMessage) => Promise<void>
  getMessages: () => Promise<StreamMessage[]>
  clearMessages: () => Promise<void>
}

class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null
  
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async saveMessage(message: StreamMessage): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...message,
        timestamp: message.timestamp.toISOString()
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getMessages(): Promise<StreamMessage[]> {
    const db = await this.getDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const messages = request.result.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        resolve(messages)
      }
    })
  }

  async clearMessages(): Promise<void> {
    const db = await this.getDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

class LocalStorageAdapter implements StorageAdapter {
  async saveMessage(message: StreamMessage): Promise<void> {
    const messages = await this.getMessages()
    const updated = messages.filter(m => m.id !== message.id)
    updated.push(message)
    updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString()
    }))))
  }

  async getMessages(): Promise<StreamMessage[]> {
    try {
      const stored = localStorage.getItem(FALLBACK_KEY)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
    } catch {
      return []
    }
  }

  async clearMessages(): Promise<void> {
    localStorage.removeItem(FALLBACK_KEY)
  }
}

function createStorageAdapter(): StorageAdapter {
  // Try IndexedDB first, fallback to localStorage
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      return new IndexedDBAdapter()
    } catch {
      console.warn('IndexedDB not available, using localStorage fallback')
      return new LocalStorageAdapter()
    }
  }
  
  return new LocalStorageAdapter()
}

export const storage = createStorageAdapter()