'use client'

import { useEffect, useState } from 'react'
import { syncManager, SyncState } from '@/lib/sync/syncManager'

export function SyncStatus() {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState())
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setSyncState)
    return () => {
      unsubscribe()
    }
  }, [])

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'synced':
        return '✓'
      case 'pending':
        return '⏳'
      case 'syncing':
        return '↻'
      case 'offline':
        return '📵'
      case 'error':
        return '⚠️'
      default:
        return '•'
    }
  }

  const getStatusColor = () => {
    switch (syncState.status) {
      case 'synced':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'syncing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = () => {
    switch (syncState.status) {
      case 'synced':
        return 'Synced'
      case 'pending':
        return `${syncState.pendingCount} pending`
      case 'syncing':
        return 'Syncing...'
      case 'offline':
        return 'Offline'
      case 'error':
        return 'Sync error'
      default:
        return 'Unknown'
    }
  }

  const handleSync = async () => {
    await syncManager.triggerSync()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition-all ${getStatusColor()}`}
      >
        <span className={syncState.status === 'syncing' ? 'animate-spin' : ''}>
          {getStatusIcon()}
        </span>
        <span>{getStatusText()}</span>
      </button>

      {isExpanded && (
        <div className="absolute bottom-14 right-0 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Sync Status</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{getStatusText()}</span>
            </div>
            
            {syncState.pendingCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium">{syncState.pendingCount} items</span>
              </div>
            )}

            {syncState.lastSyncTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last sync:</span>
                <span className="font-medium text-xs">
                  {syncState.lastSyncTime.toLocaleTimeString()}
                </span>
              </div>
            )}

            {syncState.errors.length > 0 && (
              <div className="mt-2 rounded bg-red-50 p-2">
                <p className="text-xs text-red-800">
                  {syncState.errors[0]}
                </p>
              </div>
            )}

            {syncState.pendingCount > 0 && syncState.status !== 'syncing' && (
              <button
                onClick={handleSync}
                className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
