'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  )
}
