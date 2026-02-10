import { db, getUnsyncedIssues, markIssueSynced, LocalIssue } from '@/lib/db'

// Possible sync states the application can be in
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline'

// Current state of the sync system
export interface SyncState {
  status: SyncStatus
  pendingCount: number // Number of items waiting to sync
  lastSyncTime: Date | null // When we last successfully synced
  errors: string[] // Any sync errors encountered
}

/**
 * SyncManager - Handles offline data synchronization
 * 
 * This singleton manages the queue of unsynced data and automatically
 * syncs to the server when connection is restored. It provides:
 * - Automatic sync on reconnection
 * - Periodic sync checks
 * - Manual sync triggering
 * - State updates for UI components
 */
class SyncManager {
  private syncInProgress = false
  private listeners: Set<(state: SyncState) => void> = new Set()
  private state: SyncState = {
    status: 'synced',
    pendingCount: 0,
    lastSyncTime: null,
    errors: [],
  }

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private async init() {
    // Check how many items need syncing
    await this.updatePendingCount()
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Start periodic sync checks if we're online
    if (navigator.onLine) {
      this.scheduleSyncCheck()
    }
  }

  private handleOnline() {
    this.updateState({ status: 'pending' })
    this.sync() // Trigger immediate sync when coming online
  }

  private handleOffline() {
    this.updateState({ status: 'offline' })
  }

  /**
   * Schedule periodic checks for unsynced data
   * Runs every 30 seconds to catch any missed sync triggers
   */
  private scheduleSyncCheck() {
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress && this.state.pendingCount > 0) {
        this.sync()
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Subscribe to sync state changes
   * @param listener Function to call when state updates
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: SyncState) => void) {
    this.listeners.add(listener)
    listener(this.state) // Immediately send current state
    return () => this.listeners.delete(listener)
  }

  /**
   * Update internal state and notify all listeners
   */
  private updateState(updates: Partial<SyncState>) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Update the count of pending items from IndexedDB
   */
  private async updatePendingCount() {
    const unsynced = await getUnsyncedIssues()
    this.updateState({ pendingCount: unsynced.length })
  }

  /**
   * Main sync function - syncs all unsynced items to server
   * @returns true if sync succeeded, false otherwise
   */
  async sync(): Promise<boolean> {
    // Prevent concurrent sync operations
    if (this.syncInProgress) return false
    
    // Can't sync while offline
    if (!navigator.onLine) {
      this.updateState({ status: 'offline' })
      return false
    }

    this.syncInProgress = true
    this.updateState({ status: 'syncing', errors: [] })

    try {
      const unsyncedIssues = await getUnsyncedIssues()
      
      // Nothing to sync
      if (unsyncedIssues.length === 0) {
        this.updateState({ 
          status: 'synced', 
          pendingCount: 0,
          lastSyncTime: new Date() 
        })
        return true
      }

      const errors: string[] = []

      // Sync each issue individually to avoid all-or-nothing failure
      for (const issue of unsyncedIssues) {
        try {
          await this.syncIssue(issue)
          await markIssueSynced(issue.id)
        } catch (error) {
          console.error('Failed to sync issue:', error)
          errors.push(`Failed to sync issue ${issue.id}`)
        }
      }

      // Update count after sync attempt
      await this.updatePendingCount()

      // Set status based on whether we had any failures
      this.updateState({
        status: errors.length > 0 ? 'error' : 'synced',
        lastSyncTime: new Date(),
        errors,
      })

      return errors.length === 0
    } catch (error) {
      console.error('Sync failed:', error)
      this.updateState({ 
        status: 'error', 
        errors: ['Sync failed. Will retry automatically.'] 
      })
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sync a single issue to the server
   * Handles photo upload first, then creates issue with photo reference
   */
  private async syncIssue(issue: LocalIssue): Promise<void> {
    let photoUrl: string | undefined

    // Upload photo first if present
    if (issue.photoFiles && issue.photoFiles.length > 0) {
      const formData = new FormData()
      formData.append('file', issue.photoFiles[0])

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const data = await response.json()
      photoUrl = data.url
    }

    // Create issue on server with all fields
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walkdownId: issue.walkdownId,
        roomId: issue.roomId,
        type: issue.type,
        priority: issue.priority,
        description: issue.description,
        pinX: issue.pinX,
        pinY: issue.pinY,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create issue on server')
    }

    const createdIssue = await response.json()

    // Link photo to the newly created issue
    if (photoUrl && createdIssue.id) {
      await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId: createdIssue.id,
          photoUrl,
        }),
      })
    }
  }

  /**
   * Get current sync state (for non-reactive access)
   */
  getState(): SyncState {
    return this.state
  }

  /**
   * Manually trigger a sync operation
   * Useful for user-initiated sync
   */
  async triggerSync() {
    return this.sync()
  }
}

// Export singleton instance
export const syncManager = new SyncManager()
