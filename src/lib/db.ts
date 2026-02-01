import Dexie, { Table } from 'dexie'

export interface LocalIssue {
  id: string
  walkdownId: string
  roomId: string
  title?: string
  type: string
  priority: string
  status: string
  description: string
  pinX?: number
  pinY?: number
  pinContext?: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  synced: number // 0 = false, 1 = true (IndexedDB compatible)
  photoFiles?: File[]
}

export interface LocalPhoto {
  id: string
  issueId: string
  file: File
  synced: number // 0 = false, 1 = true (IndexedDB compatible)
  createdAt: string
}

export class WalksDatabase extends Dexie {
  issues!: Table<LocalIssue>
  photos!: Table<LocalPhoto>

  constructor() {
    super('WalksDatabase')
    this.version(1).stores({
      issues: 'id, walkdownId, synced, createdAt',
      photos: 'id, issueId, synced, createdAt',
    })
  }
}

export const db = new WalksDatabase()

// Sync queue management
export async function getUnsyncedIssues(): Promise<LocalIssue[]> {
  return await db.issues.where('synced').equals(0).toArray()
}

export async function getUnsyncedPhotos(): Promise<LocalPhoto[]> {
  return await db.photos.where('synced').equals(0).toArray()
}

export async function markIssueSynced(id: string): Promise<void> {
  await db.issues.update(id, { synced: 1 })
}

export async function markPhotoSynced(id: string): Promise<void> {
  await db.photos.update(id, { synced: 1 })
}
