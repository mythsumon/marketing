'use client'

import { HotelStatus } from '@/lib/types'
import clsx from 'clsx'

const statusColors: Record<HotelStatus, string> = {
  NEW: 'bg-gray-100 text-gray-800 border-gray-300',
  CALLING: 'bg-blue-100 text-blue-800 border-blue-300',
  NO_ANSWER: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NOT_INTERESTED: 'bg-red-100 text-red-800 border-red-300',
  INTERESTED: 'bg-green-100 text-green-800 border-green-300',
  DEMO_BOOKED: 'bg-purple-100 text-purple-800 border-purple-300',
  SIGNED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}

interface StatusBadgeProps {
  status: HotelStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusColors[status],
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}





