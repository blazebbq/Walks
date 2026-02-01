'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Building {
  id: string
  name: string
  siteCode: string | null
  floors: Floor[]
}

interface Floor {
  id: string
  name: string
}

export default function NewWalkdownPage() {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')

  useEffect(() => {
    fetchBuildings()
  }, [])

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings')
      const data = await response.json()
      setBuildings(data)
      
      // Auto-generate title with today's date
      const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      setTitle(`Walkdown - ${today}`)
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/walkdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          buildingId: selectedBuildingId,
          floorId: selectedFloorId || null,
        }),
      })

      if (response.ok) {
        const walkdown = await response.json()
        router.push(`/walkdown/${walkdown.id}`)
      }
    } catch (error) {
      console.error('Error creating walkdown:', error)
    } finally {
      setCreating(false)
    }
  }

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">Create New Walkdown</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start a new facility walkdown session
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Walkdown Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="building" className="block text-sm font-medium text-gray-700">
                Building *
              </label>
              <select
                id="building"
                required
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value)
                  setSelectedFloorId('')
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select a building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                    {building.siteCode && ` (${building.siteCode})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedBuilding && selectedBuilding.floors.length > 0 && (
              <div>
                <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
                  Floor (optional)
                </label>
                <select
                  id="floor"
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">All floors</option>
                  {selectedBuilding.floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {buildings.length === 0 && (
              <div className="rounded-md bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  No buildings available. Please create a building first in the admin section.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || buildings.length === 0}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Walkdown'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
