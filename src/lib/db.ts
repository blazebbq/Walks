import Dexie, { Table } from 'dexie'

/**
 * Local issue stored in IndexedDB for offline support
 * Mirrors the server issue structure with additional offline fields
 */
export interface LocalIssue {
  id: string // UUID generated client-side
  walkdownId: string
  roomId: string
  title?: string
  type: string // Issue category (Electrical, HVAC, etc.)
  priority: string // Low, Med, High, Critical
  status: string // Open, InProgress, Closed
  description: string
  pinX?: number // Blueprint X coordinate (0-1)
  pinY?: number // Blueprint Y coordinate (0-1)
  pinContext?: string // Additional context for pin location
  createdByUserId: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
  synced: number // 0 = unsynced, 1 = synced (IndexedDB doesn't support booleans)
  photoFiles?: File[] // Actual File objects stored in IndexedDB
}

/**
 * Local photo metadata
 * Photos are stored as File objects within issues for simplicity
 */
export interface LocalPhoto {
  id: string
  issueId: string
  file: File // The actual image file
  synced: number // 0 = unsynced, 1 = synced
  createdAt: string
}

/**
 * WalksDatabase - IndexedDB wrapper using Dexie
 * 
 * Provides offline storage for:
 * - Issues created while offline
 * - Photos awaiting upload
 * 
 * Indexed fields:
 * - id: Primary key for lookups
 * - walkdownId: Query issues by walkdown
 * - synced: Find unsynced items quickly
 * - createdAt: Sort by creation time
 */
export class WalksDatabase extends Dexie {
  issues!: Table<LocalIssue>
  photos!: Table<LocalPhoto>

  constructor() {
    super('WalksDatabase')
    
    // Define schema version 1
    // Format: 'primaryKey, index1, index2, ...'
    this.version(1).stores({
      issues: 'id, walkdownId, synced, createdAt',
      photos: 'id, issueId, synced, createdAt',
    })
  }
}

// Export singleton database instance
export const db = new WalksDatabase()

// Sync queue management functions

/**
 * Get all issues that haven't been synced to server yet
 * Used by SyncManager to determine what needs uploading
 */
export async function getUnsyncedIssues(): Promise<LocalIssue[]> {
  return await db.issues.where('synced').equals(0).toArray()
}

/**
 * Get all photos that haven't been synced to server yet
 */
export async function getUnsyncedPhotos(): Promise<LocalPhoto[]> {
  return await db.photos.where('synced').equals(0).toArray()
}

/**
 * Mark an issue as successfully synced
 * Called after successful upload to server
 */
export async function markIssueSynced(id: string): Promise<void> {
  await db.issues.update(id, { synced: 1 })
}

/**
 * Mark a photo as successfully synced
 * Called after successful upload to server
 */
export async function markPhotoSynced(id: string): Promise<void> {
  await db.photos.update(id, { synced: 1 })
}
