'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface Issue {
  id: string
}

interface Room {
  id: string
  name: string
  code: string | null
  roomBlueprintImageUrl: string | null
  roomBlueprintWidth: number | null
  roomBlueprintHeight: number | null
  issues: Issue[]
}

interface Floor {
  id: string
  name: string
  blueprintImageUrl: string | null
  building: {
    id: string
    name: string
  }
}

export default function FloorDetailPage() {
  const params = useParams()
  const buildingId = params?.id as string
  const floorId = params?.floorId as string
  
  const [floor, setFloor] = useState<Floor | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (floorId) {
      fetchFloorAndRooms()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId])

  const fetchFloorAndRooms = async () => {
    try {
      const [floorsResponse, roomsResponse] = await Promise.all([
        fetch('/api/floors'),
        fetch(`/api/rooms?floorId=${floorId}`)
      ])
      
      const floors = await floorsResponse.json()
      const foundFloor = floors.find((f: Floor) => f.id === floorId)
      setFloor(foundFloor || null)

      const roomsData = await roomsResponse.json()
      setRooms(roomsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return
    }

    setDeleting(roomId)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRooms(rooms.filter(r => r.id !== roomId))
      } else {
        alert('Failed to delete room')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Failed to delete room')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!floor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Floor not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/admin/buildings/${buildingId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to {floor.building.name}
          </Link>
        </div>

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="mb-2">
              <Link
                href="/admin/buildings"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Buildings
              </Link>
              <span className="mx-2 text-sm text-gray-500">/</span>
              <Link
                href={`/admin/buildings/${buildingId}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {floor.building.name}
              </Link>
              <span className="mx-2 text-sm text-gray-500">/</span>
              <span className="text-sm text-gray-900">{floor.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{floor.name}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href={`/admin/buildings/${buildingId}/floors/${floorId}/rooms/new`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Room
            </Link>
          </div>
        </div>

        {floor.blueprintImageUrl && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Floor Blueprint</h2>
            <div className="relative w-full max-w-2xl mx-auto">
              <Image
                src={floor.blueprintImageUrl}
                alt={floor.name}
                width={800}
                height={600}
                className="w-full h-auto rounded-md border border-gray-200"
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          {rooms.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-500">No rooms yet. Add your first room to get started.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                      {room.code && (
                        <p className="mt-1 text-sm text-gray-500">Code: {room.code}</p>
                      )}
                    </div>
                  </div>

                  {room.roomBlueprintImageUrl && (
                    <div className="mt-3 relative h-32 w-full overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={room.roomBlueprintImageUrl}
                        alt={room.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {room.issues?.length || 0} issue{room.issues?.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/buildings/${buildingId}/floors/${floorId}/rooms/${room.id}/edit`}
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(room.id)}
                        disabled={deleting === room.id}
                        className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        {deleting === room.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
