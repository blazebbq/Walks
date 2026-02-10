'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface Floor {
  id: string
  name: string
  blueprintImageUrl: string | null
  blueprintWidth: number | null
  blueprintHeight: number | null
  rooms: any[]
}

interface Building {
  id: string
  name: string
  siteCode: string | null
  floors: Floor[]
}

export default function BuildingDetailPage() {
  const params = useParams()
  const buildingId = params?.id as string
  
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (buildingId) {
      fetchBuilding()
    }
  }, [buildingId])

  const fetchBuilding = async () => {
    try {
      const response = await fetch('/api/buildings')
      const buildings = await response.json()
      const found = buildings.find((b: Building) => b.id === buildingId)
      setBuilding(found || null)
    } catch (error) {
      console.error('Error fetching building:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBlueprintFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let blueprintImageUrl = null
      let blueprintWidth = null
      let blueprintHeight = null

      // Upload blueprint if provided
      if (blueprintFile) {
        const formData = new FormData()
        formData.append('file', blueprintFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          blueprintImageUrl = uploadData.url

          // Get image dimensions
          const img = document.createElement('img')
          img.src = blueprintImageUrl
          await new Promise((resolve) => {
            img.onload = () => {
              blueprintWidth = img.naturalWidth
              blueprintHeight = img.naturalHeight
              resolve(null)
            }
          })
        }
      }

      // Create floor
      const response = await fetch('/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId,
          name,
          blueprintImageUrl,
          blueprintWidth,
          blueprintHeight,
        }),
      })

      if (response.ok) {
        setName('')
        setBlueprintFile(null)
        setShowForm(false)
        fetchBuilding()
      }
    } catch (error) {
      console.error('Error creating floor:', error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!building) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Building not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/buildings"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Buildings
          </Link>
        </div>

        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
            {building.siteCode && (
              <p className="mt-1 text-sm text-gray-500">Site Code: {building.siteCode}</p>
            )}
            <p className="mt-2 text-sm text-gray-600">
              {building.floors.length} floor{building.floors.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Floor
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">New Floor</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Floor Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ground Floor, Level 1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="blueprint" className="block text-sm font-medium text-gray-700">
                  Blueprint Image (optional)
                </label>
                <input
                  type="file"
                  id="blueprint"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Creating...' : 'Create Floor'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8">
          {building.floors.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-500">No floors yet. Add your first floor to get started.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {building.floors.map((floor) => (
                <Link
                  key={floor.id}
                  href={`/admin/buildings/${buildingId}/floors/${floor.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{floor.name}</h3>
                  {floor.blueprintImageUrl && (
                    <div className="mt-3 relative h-32 w-full overflow-hidden rounded-md bg-gray-100">
                      <Image
                        src={floor.blueprintImageUrl}
                        alt={floor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    {floor.rooms?.length || 0} room{floor.rooms?.length !== 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
