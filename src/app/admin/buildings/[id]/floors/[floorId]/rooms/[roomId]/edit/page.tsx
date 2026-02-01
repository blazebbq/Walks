'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Floor {
  id: string
  name: string
  blueprintImageUrl: string | null
  building: {
    id: string
    name: string
  }
}

interface Room {
  id: string
  name: string
  code: string | null
  polygonJson: string | null
  roomBlueprintImageUrl: string | null
  roomBlueprintWidth: number | null
  roomBlueprintHeight: number | null
  floor: Floor
}

interface Point {
  x: number
  y: number
}

export default function EditRoomPage() {
  const params = useParams()
  const router = useRouter()
  const buildingId = params?.id as string
  const floorId = params?.floorId as string
  const roomId = params?.roomId as string
  
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null)
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([])
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [floorImageDimensions, setFloorImageDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  useEffect(() => {
    if (room?.floor?.blueprintImageUrl && canvasRef.current) {
      drawCanvas()
    }
  }, [room, polygonPoints])

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const roomData = await response.json()
      setRoom(roomData)
      setName(roomData.name)
      setCode(roomData.code || '')
      
      if (roomData.polygonJson) {
        try {
          const points = JSON.parse(roomData.polygonJson)
          setPolygonPoints(points)
        } catch (e) {
          console.error('Failed to parse polygon JSON:', e)
        }
      }
    } catch (error) {
      console.error('Error fetching room:', error)
    } finally {
      setLoading(false)
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !room?.floor?.blueprintImageUrl) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      const maxWidth = 800
      const scale = Math.min(maxWidth / img.width, 1)
      const width = img.width * scale
      const height = img.height * scale
      
      canvas.width = width
      canvas.height = height
      setFloorImageDimensions({ width: img.width, height: img.height })
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, width, height)
      
      if (polygonPoints.length > 0) {
        ctx.strokeStyle = '#3b82f6'
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
        ctx.lineWidth = 2
        
        ctx.beginPath()
        const firstPoint = polygonPoints[0]
        ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale)
        
        for (let i = 1; i < polygonPoints.length; i++) {
          ctx.lineTo(polygonPoints[i].x * scale, polygonPoints[i].y * scale)
        }
        
        if (polygonPoints.length > 2) {
          ctx.closePath()
          ctx.fill()
        }
        ctx.stroke()
        
        polygonPoints.forEach((point) => {
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(point.x * scale, point.y * scale, 5, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    }
    img.src = room.floor.blueprintImageUrl
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = floorImageDimensions.width / canvas.width
    const scaleY = floorImageDimensions.height / canvas.height
    
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    
    setPolygonPoints([...polygonPoints, { x, y }])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBlueprintFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      let roomBlueprintImageUrl = room?.roomBlueprintImageUrl
      let roomBlueprintWidth = room?.roomBlueprintWidth
      let roomBlueprintHeight = room?.roomBlueprintHeight

      if (blueprintFile) {
        const formData = new FormData()
        formData.append('file', blueprintFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          roomBlueprintImageUrl = uploadData.url

          if (roomBlueprintImageUrl) {
            const img = document.createElement('img')
            img.src = roomBlueprintImageUrl
            await new Promise((resolve) => {
              img.onload = () => {
                roomBlueprintWidth = img.naturalWidth
                roomBlueprintHeight = img.naturalHeight
                resolve(null)
              }
            })
          }
        }
      }

      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: code || null,
          polygonJson: polygonPoints.length > 0 ? JSON.stringify(polygonPoints) : null,
          roomBlueprintImageUrl,
          roomBlueprintWidth,
          roomBlueprintHeight,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/admin/buildings/${buildingId}/floors/${floorId}`)
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update room')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      setError('Failed to update room')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/admin/buildings/${buildingId}/floors/${floorId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to {room.floor.name}
          </Link>
        </div>

        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-500">
            <Link href="/admin/buildings" className="hover:text-gray-700">
              Buildings
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/admin/buildings/${buildingId}`}
              className="hover:text-gray-700"
            >
              {room.floor.building.name}
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/admin/buildings/${buildingId}/floors/${floorId}`}
              className="hover:text-gray-700"
            >
              {room.floor.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Edit {room.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Room</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update details for {room.name}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">Room updated successfully! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Room Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Room Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Conference Room A, Office 101"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Room Code (optional)
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., CR-A, OFF-101"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              {room.roomBlueprintImageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Room Blueprint
                  </label>
                  <div className="relative h-48 w-full max-w-md overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                    <Image
                      src={room.roomBlueprintImageUrl}
                      alt={room.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="blueprint" className="block text-sm font-medium text-gray-700">
                  {room.roomBlueprintImageUrl ? 'Replace' : 'Upload'} Room Blueprint
                </label>
                <input
                  type="file"
                  id="blueprint"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload a detailed blueprint image for this specific room
                </p>
              </div>
            </div>
          </div>

          {room.floor.blueprintImageUrl && (
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Room Location on Floor Blueprint
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Click on the floor plan to mark the room boundaries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingMode(!isDrawingMode)
                    if (isDrawingMode) {
                      if (room.polygonJson) {
                        try {
                          const points = JSON.parse(room.polygonJson)
                          setPolygonPoints(points)
                        } catch (e) {
                          setPolygonPoints([])
                        }
                      } else {
                        setPolygonPoints([])
                      }
                    }
                  }}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${
                    isDrawingMode
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isDrawingMode ? 'Cancel Drawing' : 'Edit Room Boundary'}
                </button>
              </div>

              {polygonPoints.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-md bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">
                    {polygonPoints.length} point{polygonPoints.length !== 1 ? 's' : ''} marked
                  </p>
                  <button
                    type="button"
                    onClick={() => setPolygonPoints([])}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Clear Points
                  </button>
                </div>
              )}

              <div className="border border-gray-200 rounded-md overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className={`w-full ${isDrawingMode ? 'cursor-crosshair' : ''}`}
                />
              </div>

              {isDrawingMode && (
                <p className="mt-2 text-sm text-gray-600">
                  Click on the floor plan to add points. Click at least 3 points to create a boundary.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/admin/buildings/${buildingId}/floors/${floorId}`}
              className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
