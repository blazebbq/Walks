'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Building {
  id: string
  name: string
  siteCode: string | null
  floors: any[]
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [siteCode, setSiteCode] = useState('')

  useEffect(() => {
    fetchBuildings()
  }, [])

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings')
      const data = await response.json()
      setBuildings(data)
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, siteCode: siteCode || null }),
      })

      if (response.ok) {
        setName('')
        setSiteCode('')
        setShowForm(false)
        fetchBuildings()
      }
    } catch (error) {
      console.error('Error creating building:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buildings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage buildings and their associated floors and rooms
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Building
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">New Building</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="siteCode" className="block text-sm font-medium text-gray-700">
                  Site Code
                </label>
                <input
                  type="text"
                  id="siteCode"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Building
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
          {buildings.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-500">No buildings yet. Create your first building to get started.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {buildings.map((building) => (
                <Link
                  key={building.id}
                  href={`/admin/buildings/${building.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{building.name}</h3>
                  {building.siteCode && (
                    <p className="mt-1 text-sm text-gray-500">Code: {building.siteCode}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    {building.floors?.length || 0} floor{building.floors?.length !== 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
