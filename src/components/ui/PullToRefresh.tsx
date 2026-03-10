'use client'

import { useState, useEffect, useRef } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pullDistance = useRef(0)

  useEffect(() => {
    let isMounted = true

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (refreshing) return
      
      const currentY = e.touches[0].clientY
      pullDistance.current = currentY - startY.current

      if (pullDistance.current > 0 && window.scrollY === 0) {
        setPulling(true)
      }
    }

    const handleTouchEnd = async () => {
      if (!isMounted) return

      if (pulling && pullDistance.current > 80) {
        setRefreshing(true)
        try {
          await onRefresh()
        } finally {
          if (isMounted) {
            setRefreshing(false)
          }
        }
      }
      
      if (isMounted) {
        setPulling(false)
        pullDistance.current = 0
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      isMounted = false
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pulling, refreshing, onRefresh])

  return (
    <div className="relative">
      {(pulling || refreshing) && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 transition-transform">
          <div className="rounded-full bg-white p-2 shadow-lg">
            <div className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`}>
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
