'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const toast: Toast = {
    id: crypto.randomUUID(),
    message,
    type,
    duration,
  }
  toastListeners.forEach(listener => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast])
      
      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, toast.duration)
      }
    }

    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '•'
    }
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right ${getTypeStyles()}`}
    >
      <span className="text-lg">{getIcon()}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  )
}
