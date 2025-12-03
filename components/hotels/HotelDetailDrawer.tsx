'use client'

import { useState } from 'react'
import { Hotel, HotelStatus } from '@/lib/types'
import { useHotelDetail, useHotelNotes, useHotelActivity, useUpdateHotelStatus, useUpdateHotelAssignee, useUpdateHotelFollowUp, useCreateNote, useCreateHotel, useUsers } from '@/hooks/useMockQueries'
import { useRegions } from '@/hooks/useRegions'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import clsx from 'clsx'

interface HotelDetailDrawerProps {
  hotelId: string | null
  onClose: () => void
}

export function HotelDetailDrawer({ hotelId, onClose }: HotelDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'notes'>('notes')
  const [noteContent, setNoteContent] = useState('')
  const [localStatus, setLocalStatus] = useState<HotelStatus | null>(null)
  const [localAssignee, setLocalAssignee] = useState<string | null>(null)
  const [localFollowUp, setLocalFollowUp] = useState<string | null>(null)
  
  // Form state for new hotel
  const [newHotelData, setNewHotelData] = useState({
    hotelName: '',
    region: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    status: 'NEW' as HotelStatus,
    assignee: null as string | null,
    nextFollowUpDate: null as string | null,
  })

  const { data: hotel } = useHotelDetail(hotelId === 'new' ? null : hotelId)
  const { data: notes } = useHotelNotes(hotelId === 'new' ? null : hotelId)
  const { data: activity } = useHotelActivity(hotelId === 'new' ? null : hotelId)
  const { data: users } = useUsers()
  const { data: regions } = useRegions()

  const updateStatusMutation = useUpdateHotelStatus()
  const updateAssigneeMutation = useUpdateHotelAssignee()
  const updateFollowUpMutation = useUpdateHotelFollowUp()
  const createNoteMutation = useCreateNote()
  const createHotelMutation = useCreateHotel()

  const isNewHotel = hotelId === 'new'
  
  // Create a default hotel object for new hotels
  const defaultHotel: Hotel = {
    id: 'new',
    hotelName: newHotelData.hotelName,
    region: newHotelData.region,
    address: newHotelData.address,
    phone: newHotelData.phone,
    email: newHotelData.email,
    website: newHotelData.website,
    status: newHotelData.status,
    assignee: newHotelData.assignee,
    nextFollowUpDate: newHotelData.nextFollowUpDate,
    lastUpdatedAt: new Date().toISOString(),
  }

  const displayHotel = isNewHotel ? defaultHotel : hotel
  if (!displayHotel) return null

  const currentStatus = localStatus !== null ? localStatus : (isNewHotel ? newHotelData.status : displayHotel.status)
  const currentAssignee = localAssignee !== null ? localAssignee : (isNewHotel ? newHotelData.assignee : displayHotel.assignee)
  const currentFollowUp = localFollowUp !== null ? localFollowUp : (isNewHotel ? newHotelData.nextFollowUpDate : displayHotel.nextFollowUpDate)

  const handleStatusChange = async (newStatus: HotelStatus) => {
    setLocalStatus(newStatus)
    if (hotelId) {
      await updateStatusMutation.mutateAsync({ hotelId, status: newStatus })
      setLocalStatus(null)
    }
  }

  const handleAssigneeChange = async (assigneeId: string) => {
    setLocalAssignee(assigneeId)
    if (hotelId) {
      await updateAssigneeMutation.mutateAsync({ hotelId, assigneeId: assigneeId || null })
      setLocalAssignee(null)
    }
  }

  const handleFollowUpChange = async (date: string) => {
    setLocalFollowUp(date)
    if (hotelId) {
      await updateFollowUpMutation.mutateAsync({ hotelId, date: date || null })
      setLocalFollowUp(null)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim() || !hotelId || isNewHotel) return
    await createNoteMutation.mutateAsync({ hotelId, content: noteContent })
    setNoteContent('')
  }

  const handleSaveNewHotel = async () => {
    if (!newHotelData.hotelName.trim() || !newHotelData.region.trim()) {
      alert('Please fill in Hotel Name and Region')
      return
    }
    try {
      const createdHotel = await createHotelMutation.mutateAsync(newHotelData)
      // Close drawer - the list will refresh automatically via query invalidation
      onClose()
      // Optionally, you could open the newly created hotel:
      // setTimeout(() => {
      //   window.location.href = `/hotels?id=${createdHotel.id}`
      // }, 100)
    } catch (error) {
      console.error('Failed to create hotel:', error)
      alert('Failed to create hotel. Please try again.')
    }
  }

  const handleNewHotelFieldChange = (field: keyof typeof newHotelData, value: any) => {
    setNewHotelData((prev) => ({ ...prev, [field]: value }))
  }

  const statusOptions: HotelStatus[] = ['NEW', 'CALLING', 'NO_ANSWER', 'NOT_INTERESTED', 'INTERESTED', 'DEMO_BOOKED', 'SIGNED']

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full lg:w-2/3 xl:w-1/2 bg-white z-50 lg:z-40 shadow-xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isNewHotel ? 'New Hotel' : displayHotel.hotelName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Hotel Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {isNewHotel ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Hotel Name *</label>
                          <input
                            type="text"
                            value={newHotelData.hotelName}
                            onChange={(e) => handleNewHotelFieldChange('hotelName', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter hotel name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Region *</label>
                          <select
                            value={newHotelData.region}
                            onChange={(e) => handleNewHotelFieldChange('region', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Select region</option>
                            {regions?.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            value={newHotelData.address}
                            onChange={(e) => handleNewHotelFieldChange('address', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter address"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={newHotelData.phone}
                            onChange={(e) => handleNewHotelFieldChange('phone', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={newHotelData.email}
                            onChange={(e) => handleNewHotelFieldChange('email', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                          <input
                            type="url"
                            value={newHotelData.website}
                            onChange={(e) => handleNewHotelFieldChange('website', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Region</p>
                          <p className="text-sm font-medium text-gray-900">{displayHotel.region || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm text-gray-900">{displayHotel.address || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          {displayHotel.phone ? (
                            <a href={`tel:${displayHotel.phone}`} className="text-sm text-primary-600 hover:underline">
                              {displayHotel.phone}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-900">-</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          {displayHotel.email ? (
                            <a href={`mailto:${displayHotel.email}`} className="text-sm text-primary-600 hover:underline">
                              {displayHotel.email}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-900">-</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Website</p>
                          {displayHotel.website ? (
                            <a
                              href={displayHotel.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:underline"
                            >
                              {displayHotel.website}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-900">-</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Outreach Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={currentStatus}
                        onChange={(e) => {
                          if (isNewHotel) {
                            handleNewHotelFieldChange('status', e.target.value as HotelStatus)
                          } else {
                            handleStatusChange(e.target.value as HotelStatus)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
                      <select
                        value={currentAssignee || ''}
                        onChange={(e) => {
                          if (isNewHotel) {
                            handleNewHotelFieldChange('assignee', e.target.value || null)
                          } else {
                            handleAssigneeChange(e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Unassigned</option>
                        {users?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={currentFollowUp || ''}
                        onChange={(e) => {
                          if (isNewHotel) {
                            handleNewHotelFieldChange('nextFollowUpDate', e.target.value || null)
                          } else {
                            handleFollowUpChange(e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {!isNewHotel && (
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(displayHotel.lastUpdatedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                    {isNewHotel && (
                      <div className="mt-4">
                        <Button
                          onClick={handleSaveNewHotel}
                          disabled={!newHotelData.hotelName.trim() || !newHotelData.region.trim() || createHotelMutation.isPending}
                          className="w-full"
                        >
                          {createHotelMutation.isPending ? 'Creating...' : 'Create Hotel'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Tabs */}
              <div>
                <div className="border-b border-gray-200 mb-4">
                  <nav className="flex space-x-4">
                    <button
                      onClick={() => setActiveTab('activity')}
                      className={clsx(
                        'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'activity'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Activity
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={clsx(
                        'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                        activeTab === 'notes'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Notes
                    </button>
                  </nav>
                </div>

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {activity && activity.length > 0 ? (
                      activity.map((log) => (
                        <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                {log.action === 'status_changed' && log.oldStatus && log.newStatus ? (
                                  <>
                                    Status changed from <span className="font-medium">{log.oldStatus}</span> to{' '}
                                    <span className="font-medium">{log.newStatus}</span>
                                  </>
                                ) : (
                                  log.action.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                by {log.userName} • {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">No activity yet</div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {!isNewHotel ? (
                      <>
                        <div className="space-y-3">
                          {notes && notes.length > 0 ? (
                            notes.map((note) => (
                              <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-900">{note.authorName}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">No notes yet</div>
                          )}
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Add a note..."
                            rows={4}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <div className="mt-2 flex justify-end">
                            <Button
                              onClick={handleAddNote}
                              disabled={!noteContent.trim() || createNoteMutation.isPending}
                              size="sm"
                            >
                              {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Notes will be available after creating the hotel.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

