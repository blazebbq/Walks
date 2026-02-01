'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Walkdown {
  id: string
  title: string
  status: string
  building: {
    id: string
    name: string
  }
  floor: {
    id: string
    name: string
  } | null
  createdBy: {
    name: string | null
    email: string
  }
  issues: Issue[]
  createdAt: string
}

interface Issue {
  id: string
  title: string | null
  type: string
  priority: string
  status: string
  description: string
  room: {
    name: string
  }
  photos: {
    photoUrl: string
  }[]
  createdAt: string
}

export default function WalkdownDetailPage() {
  const params = useParams()
  const walkdownId = params?.id as string

  const [walkdown, setWalkdown] = useState<Walkdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    if (walkdownId) {
      fetchWalkdown()
    }
  }, [walkdownId])

  const fetchWalkdown = async () => {
    try {
      const response = await fetch('/api/walkdowns')
      const walkdowns = await response.json()
      const found = walkdowns.find((w: Walkdown) => w.id === walkdownId)
      setWalkdown(found || null)
    } catch (error) {
      console.error('Error fetching walkdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Med':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800'
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Closed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleGeneratePDF = async () => {
    if (!walkdownId) return

    setGeneratingPDF(true)
    try {
      const response = await fetch(`/api/walkdowns/${walkdownId}/report`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `walkdown-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!walkdown) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Walkdown not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/walkdown"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Walkdowns
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{walkdown.title}</h1>
              <div className="mt-2 text-sm text-gray-600">
                <p>🏢 {walkdown.building.name}</p>
                {walkdown.floor && <p>📍 {walkdown.floor.name}</p>}
                <p className="mt-1">
                  Created by {walkdown.createdBy.name || walkdown.createdBy.email} on{' '}
                  {new Date(walkdown.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  walkdown.status === 'Draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : walkdown.status === 'Submitted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {walkdown.status}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Issues ({walkdown.issues.length})
              </h2>
              <Link
                href={`/walkdown/${walkdownId}/add-issue`}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Issue
              </Link>
            </div>

            {walkdown.issues.length === 0 ? (
              <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500">No issues recorded yet.</p>
                <Link
                  href={`/walkdown/${walkdownId}/add-issue`}
                  className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add First Issue
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {walkdown.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {issue.title || `${issue.type} Issue`}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          📍 {issue.room.name}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">{issue.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(
                              issue.priority
                            )}`}
                          >
                            {issue.priority}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                              issue.status
                            )}`}
                          >
                            {issue.status}
                          </span>
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                            {issue.type}
                          </span>
                        </div>
                      </div>
                      {issue.photos.length > 0 && (
                        <div className="ml-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
                          <img
                            src={issue.photos[0].photoUrl}
                            alt="Issue"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button 
            onClick={handleGeneratePDF}
            disabled={generatingPDF}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPDF ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Generating PDF...
              </>
            ) : (
              '📄 Generate PDF Report'
            )}
          </button>
          <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Mark as Submitted
          </button>
        </div>
      </div>
    </div>
  )
}
