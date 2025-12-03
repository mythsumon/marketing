'use client'

import { HotelStatus } from '@/lib/types'

interface StatusDistributionChartProps {
  data: Record<HotelStatus, number>
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0)
  const statusColors: Record<HotelStatus, string> = {
    NEW: 'bg-gray-400',
    CALLING: 'bg-blue-400',
    NO_ANSWER: 'bg-yellow-400',
    NOT_INTERESTED: 'bg-red-400',
    INTERESTED: 'bg-green-400',
    DEMO_BOOKED: 'bg-purple-400',
    SIGNED: 'bg-emerald-400',
  }

  const statusLabels: Record<HotelStatus, string> = {
    NEW: 'New',
    CALLING: 'Calling',
    NO_ANSWER: 'No Answer',
    NOT_INTERESTED: 'Not Interested',
    INTERESTED: 'Interested',
    DEMO_BOOKED: 'Demo Booked',
    SIGNED: 'Signed',
  }

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([status, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{statusLabels[status as HotelStatus]}</span>
              <span className="text-gray-600">{count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${statusColors[status as HotelStatus]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}





