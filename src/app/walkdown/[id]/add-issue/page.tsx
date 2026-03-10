'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, LocalIssue } from '@/lib/db'

interface Room {
  id: string
  name: string
  code: string | null
  floor: {
    id: string
    name: string
    building: {
      id: string
      name: string
    }
  }
}

interface FormData {
  roomId: string
  type: string
  priority: string
  description: string
  pinX?: number
  pinY?: number
}

const ISSUE_TYPES = [
  'Electrical',
  'Structural',
  'Cleanliness',
  'HVAC',
  'Walls',
  'Ceiling',
  'Floor',
  'Labels',
]

const PRIORITIES = ['Low', 'Med', 'High', 'Critical']

export default function AddIssuePage() {
  const params = useParams()
  const router = useRouter()
  const walkdownId = params?.id as string

  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    roomId: '',
    type: '',
    priority: 'Med',
    description: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isOnline, setIsOnline] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const session = await response.json()
        if (session?.user?.id) {
          setCurrentUserId(session.user.id)
        }
      }
    } catch (error) {
      console.error('Error fetching user session:', error)
    }
  }

  useEffect(() => {
    fetchWalkdownAndRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkdownId])

  const fetchWalkdownAndRooms = async () => {
    try {
      const response = await fetch('/api/walkdowns')
      const walkdowns = await response.json()
      const walkdown = walkdowns.find((w: { id: string; floor?: { id: string } }) => w.id === walkdownId)

      if (walkdown?.floor?.id) {
        await fetchRooms(walkdown.floor.id)
      } else {
        await fetchRooms(null)
      }
    } catch (error) {
      console.error('Error fetching walkdown:', error)
      await fetchRooms(null)
    }
  }

  const fetchRooms = async (floorIdParam: string | null) => {
    try {
      const url = floorIdParam
        ? `/api/rooms?floorId=${floorIdParam}`
        : '/api/rooms'
      const response = await fetch(url)
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.roomId) {
      newErrors.roomId = 'Please select a room'
    }
    if (!formData.type) {
      newErrors.type = 'Please select an issue type'
    }
    if (!formData.priority) {
      newErrors.priority = 'Please select a priority'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveToIndexedDB = async (
    issueData: FormData,
    photoFile: File | null
  ): Promise<string> => {
    const issueId = crypto.randomUUID()
    
    const localIssue: LocalIssue = {
      id: issueId,
      walkdownId,
      roomId: issueData.roomId,
      title: `${issueData.type} - ${issueData.priority}`,
      type: issueData.type,
      priority: issueData.priority,
      status: 'Open',
      description: issueData.description,
      pinX: issueData.pinX,
      pinY: issueData.pinY,
      createdByUserId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: 0,
      photoFiles: photoFile ? [photoFile] : undefined,
    }

    await db.issues.add(localIssue)
    return issueId
  }

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload photo')
    }

    const data = await response.json()
    return data.url
  }

  const createIssueOnServer = async (photoUrl?: string): Promise<string> => {
    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walkdownId,
        roomId: formData.roomId,
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        pinX: formData.pinX,
        pinY: formData.pinY,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create issue')
    }

    const issue = await response.json()

    if (photoUrl && issue.id) {
      await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueId: issue.id,
          photoUrl,
        }),
      }).catch((err) => {
        console.error('Failed to link photo to issue:', err)
      })
    }

    return issue.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!currentUserId) {
      setErrors({ submit: 'Please wait for authentication or refresh the page.' })
      return
    }

    setSubmitting(true)
    setSaveStatus('saving')

    try {
      if (isOnline) {
        let photoUrl: string | undefined

        if (photo) {
          photoUrl = await uploadPhoto(photo)
        }

        await createIssueOnServer(photoUrl)
        setSaveStatus('saved')
        
        // Show success toast
        const { showToast } = await import('@/components/ui/Toast')
        showToast('Issue saved successfully!', 'success')
        
        setTimeout(() => {
          router.push(`/walkdown/${walkdownId}`)
        }, 500)
      } else {
        await saveToIndexedDB(formData, photo)
        setSaveStatus('saved')
        
        // Show offline save toast
        const { showToast } = await import('@/components/ui/Toast')
        showToast('Issue saved offline. Will sync when online.', 'info')
        
        setTimeout(() => {
          router.push(`/walkdown/${walkdownId}`)
        }, 500)
      }
    } catch (error) {
      console.error('Error saving issue:', error)
      setSaveStatus('error')
      
      const { showToast } = await import('@/components/ui/Toast')
      
      try {
        await saveToIndexedDB(formData, photo)
        setSaveStatus('saved')
        showToast('Saved offline. Will sync when online.', 'warning')
        setTimeout(() => {
          router.push(`/walkdown/${walkdownId}`)
        }, 1000)
      } catch (dbError) {
        console.error('Failed to save to IndexedDB:', dbError)
        setErrors({ submit: 'Failed to save issue. Please try again.' })
        showToast('Failed to save issue', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 min-h-[44px]"
            disabled={submitting}
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Add Issue</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {!isOnline && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="rounded-md bg-yellow-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You&apos;re offline. Issue will be saved locally and synced later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-gray-700"
            >
              Room <span className="text-red-500">*</span>
            </label>
            <select
              id="room"
              value={formData.roomId}
              onChange={(e) => handleInputChange('roomId', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${
                errors.roomId ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              disabled={loadingRooms || submitting}
            >
              <option value="">
                {loadingRooms ? 'Loading rooms...' : 'Select a room'}
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                  {room.code ? ` (${room.code})` : ''}
                </option>
              ))}
            </select>
            {errors.roomId && (
              <p className="mt-1 text-sm text-red-600">{errors.roomId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Issue Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              disabled={submitting}
            >
              <option value="">Select issue type</option>
              {ISSUE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700"
            >
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${
                errors.priority ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              disabled={submitting}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Describe the issue in detail (minimum 10 characters)"
              disabled={submitting}
            />
            <div className="mt-1 flex justify-between">
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {formData.description.length} / 10 minimum characters
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Photo
            </label>
            <div className="mt-1">
              {!photoPreview ? (
                <label
                  htmlFor="photo"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-white px-6 py-8 hover:border-gray-400"
                >
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Tap to take photo or select from gallery
                  </p>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={submitting}
                  />
                </label>
              ) : (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Issue preview"
                    className="w-full rounded-md"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"
                    disabled={submitting}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-700">
              Blueprint Pin (Optional)
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              You can add blueprint coordinates later
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="pinX"
                  className="block text-xs font-medium text-gray-600"
                >
                  X Coordinate (0-1)
                </label>
                <input
                  id="pinX"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.pinX || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'pinX',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.5"
                  disabled={submitting}
                />
              </div>
              <div>
                <label
                  htmlFor="pinY"
                  className="block text-xs font-medium text-gray-600"
                >
                  Y Coordinate (0-1)
                </label>
                <input
                  id="pinY"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.pinY || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'pinY',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.5"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-6 border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <div className="mx-auto flex max-w-2xl gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              disabled={submitting || loadingRooms}
            >
              {submitting
                ? saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? 'Saved ✓'
                  : 'Save Issue'
                : 'Save Issue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
