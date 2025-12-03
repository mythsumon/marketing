'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { useHotelList, useBulkUpdateHotels, useUsers } from '@/hooks/useMockQueries'
import { HotelListFilters, HotelStatus } from '@/lib/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { HotelDetailDrawer } from '@/components/hotels/HotelDetailDrawer'
import { format } from 'date-fns'
import { getRegions } from '@/lib/mockData'
import clsx from 'clsx'

const statusOptions: HotelStatus[] = ['NEW', 'CALLING', 'NO_ANSWER', 'NOT_INTERESTED', 'INTERESTED', 'DEMO_BOOKED', 'SIGNED']

function HotelsPageContent() {
  const searchParams = useSearchParams()
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null)
  const [selectedHotelIds, setSelectedHotelIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<HotelListFilters>({
    region: searchParams.get('region') || undefined,
    status: [],
    assignee: 'all',
    followUpFilter: 'all',
  })

  const { data: hotelList, isLoading } = useHotelList(filters, page, 10)
  const { data: users } = useUsers()
  const bulkUpdateMutation = useBulkUpdateHotels()

  useEffect(() => {
    const hotelId = searchParams.get('id')
    if (hotelId) {
      setSelectedHotelId(hotelId)
    }
  }, [searchParams])

  const handleFilterChange = (key: keyof HotelListFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const toggleStatusFilter = (status: HotelStatus) => {
    setFilters((prev) => {
      const currentStatuses = prev.status || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status]
      return { ...prev, status: newStatuses.length > 0 ? newStatuses : undefined }
    })
    setPage(1)
  }

  const toggleHotelSelection = (hotelId: string) => {
    setSelectedHotelIds((prev) => {
      const next = new Set(prev)
      if (next.has(hotelId)) {
        next.delete(hotelId)
      } else {
        next.add(hotelId)
      }
      return next
    })
  }

  const toggleAllSelection = () => {
    if (selectedHotelIds.size === hotelList?.data.length) {
      setSelectedHotelIds(new Set())
    } else {
      setSelectedHotelIds(new Set(hotelList?.data.map((h) => h.id) || []))
    }
  }

  const handleBulkStatusChange = async (status: HotelStatus) => {
    if (selectedHotelIds.size === 0) return
    await bulkUpdateMutation.mutateAsync({
      hotelIds: Array.from(selectedHotelIds),
      updates: { status },
    })
    setSelectedHotelIds(new Set())
  }

  const handleBulkAssigneeChange = async (assigneeId: string) => {
    if (selectedHotelIds.size === 0) return
    await bulkUpdateMutation.mutateAsync({
      hotelIds: Array.from(selectedHotelIds),
      updates: { assignee: assigneeId || null },
    })
    setSelectedHotelIds(new Set())
  }

  const clearFilters = () => {
    setFilters({
      region: undefined,
      status: [],
      assignee: 'all',
      followUpFilter: 'all',
    })
    setPage(1)
  }

  const totalPages = hotelList ? Math.ceil(hotelList.totalCount / hotelList.pageSize) : 0

  const handleNewHotel = () => {
    // For now, we'll create a temporary ID and open the drawer
    // In a real app, you'd create the hotel first, then open it
    setSelectedHotelId('new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Hotel Outreach List"
        showFilters
        regionFilter={filters.region}
        onRegionChange={(region) => handleFilterChange('region', region || undefined)}
        showMyHotelsFilter
        myHotelsOnly={filters.assignee === 'me'}
        onMyHotelsToggle={(value) => handleFilterChange('assignee', value ? 'me' : 'all')}
        actionButton={
          <Button onClick={handleNewHotel} variant="primary">
            <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Hotel
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const isSelected = filters.status?.includes(status)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={clsx(
                        'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                        isSelected
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Assignee:</span>
              <select
                value={filters.assignee || 'all'}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All</option>
                <option value="me">Me</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Follow-up:</span>
              <select
                value={filters.followUpFilter || 'all'}
                onChange={(e) => handleFilterChange('followUpFilter', e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedHotelIds.size > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                {selectedHotelIds.size} hotel{selectedHotelIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBulkStatusChange(e.target.value as HotelStatus)
                    e.target.value = ''
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Change Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(e) => {
                    handleBulkAssigneeChange(e.target.value)
                    e.target.value = ''
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Assign To</option>
                  <option value="">Unassign</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <Button onClick={() => setSelectedHotelIds(new Set())} variant="ghost" size="sm">
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : hotelList && hotelList.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedHotelIds.size === hotelList.data.length && hotelList.data.length > 0}
                          onChange={toggleAllSelection}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hotel Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Follow-up
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hotelList.data.map((hotel) => (
                      <tr
                        key={hotel.id}
                        className={clsx(
                          'hover:bg-gray-50 cursor-pointer',
                          selectedHotelIds.has(hotel.id) && 'bg-primary-50'
                        )}
                        onClick={() => setSelectedHotelId(hotel.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedHotelIds.has(hotel.id)}
                            onChange={() => toggleHotelSelection(hotel.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {hotel.hotelName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{hotel.region}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={hotel.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {users?.find((u) => u.id === hotel.assignee)?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {hotel.nextFollowUpDate ? format(new Date(hotel.nextFollowUpDate), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(hotel.lastUpdatedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" onClick={() => setSelectedHotelId(hotel.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * hotelList.pageSize + 1} to {Math.min(page * hotelList.pageSize, hotelList.totalCount)} of{' '}
                    {hotelList.totalCount} hotels
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">No hotels found</div>
          )}
        </div>
      </div>

      {/* Hotel Detail Drawer */}
      {selectedHotelId && (
        <HotelDetailDrawer hotelId={selectedHotelId} onClose={() => setSelectedHotelId(null)} />
      )}
    </div>
  )
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <HotelsPageContent />
    </Suspense>
  )
}

