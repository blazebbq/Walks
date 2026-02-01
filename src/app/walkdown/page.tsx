'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Walkdown {
  id: string
  title: string
  status: string
  building: {
    name: string
  }
  floor: {
    name: string
  } | null
  createdBy: {
    name: string | null
    email: string
  }
  issues: any[]
  createdAt: string
}

export default function WalkdownsPage() {
  const [walkdowns, setWalkdowns] = useState<Walkdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWalkdowns()
  }, [])

  const fetchWalkdowns = async () => {
    try {
      const response = await fetch('/api/walkdowns')
      const data = await response.json()
      setWalkdowns(data)
    } catch (error) {
      console.error('Error fetching walkdowns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'Submitted':
        return 'bg-green-100 text-green-800'
      case 'Archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            <h1 className="text-3xl font-bold text-gray-900">Walkdowns</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage facility walkdown sessions
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/walkdown/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New Walkdown
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {walkdowns.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-500">No walkdowns yet. Create your first walkdown to get started.</p>
              <Link
                href="/walkdown/new"
                className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Walkdown
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {walkdowns.map((walkdown) => (
                <Link
                  key={walkdown.id}
                  href={`/walkdown/${walkdown.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{walkdown.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>🏢 {walkdown.building.name}</span>
                        {walkdown.floor && <span>· {walkdown.floor.name}</span>}
                        <span>· 📋 {walkdown.issues.length} issue{walkdown.issues.length !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Created by {walkdown.createdBy.name || walkdown.createdBy.email} on{' '}
                        {new Date(walkdown.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        walkdown.status
                      )}`}
                    >
                      {walkdown.status}
                    </span>
                  </div>
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
