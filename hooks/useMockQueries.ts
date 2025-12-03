'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Hotel,
  User,
  Note,
  ActivityLog,
  DashboardSummary,
  HotelListFilters,
  PaginatedResponse,
  HotelStatus,
} from '@/lib/types'
import {
  getHotels,
  setHotels,
  getNotes,
  addNote,
  getActivityLogs,
  addActivityLog,
  mockUsers,
} from '@/lib/mockData'
import { format, isBefore, isToday, startOfWeek, endOfWeek, parseISO } from 'date-fns'

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Dashboard hooks
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      await delay(300)
      const hotels = getHotels()
      const statusDistribution: Record<HotelStatus, number> = {
        NEW: 0,
        CALLING: 0,
        NO_ANSWER: 0,
        NOT_INTERESTED: 0,
        INTERESTED: 0,
        DEMO_BOOKED: 0,
        SIGNED: 0,
      }

      hotels.forEach((hotel) => {
        statusDistribution[hotel.status]++
      })

      const regionStatusMatrix: Record<string, Record<HotelStatus, number>> = {}
      hotels.forEach((hotel) => {
        if (!regionStatusMatrix[hotel.region]) {
          regionStatusMatrix[hotel.region] = {
            NEW: 0,
            CALLING: 0,
            NO_ANSWER: 0,
            NOT_INTERESTED: 0,
            INTERESTED: 0,
            DEMO_BOOKED: 0,
            SIGNED: 0,
          }
        }
        regionStatusMatrix[hotel.region][hotel.status]++
      })

      return {
        totalHotels: hotels.length,
        newHotels: statusDistribution.NEW,
        interestedHotels: statusDistribution.INTERESTED + statusDistribution.DEMO_BOOKED,
        signedHotels: statusDistribution.SIGNED,
        statusDistribution,
        regionStatusMatrix,
      }
    },
  })
}

export function useUpcomingFollowUps() {
  return useQuery<Hotel[]>({
    queryKey: ['dashboard', 'followups'],
    queryFn: async () => {
      await delay(300)
      const hotels = getHotels()
      const today = new Date()
      return hotels
        .filter((hotel) => {
          if (!hotel.nextFollowUpDate) return false
          const followUpDate = parseISO(hotel.nextFollowUpDate)
          return isBefore(followUpDate, today) || isToday(followUpDate)
        })
        .sort((a, b) => {
          if (!a.nextFollowUpDate) return 1
          if (!b.nextFollowUpDate) return -1
          return parseISO(a.nextFollowUpDate).getTime() - parseISO(b.nextFollowUpDate).getTime()
        })
    },
  })
}

// Hotel list hooks
export function useHotelList(filters: HotelListFilters = {}, page: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedResponse<Hotel>>({
    queryKey: ['hotels', 'list', filters, page, pageSize],
    queryFn: async () => {
      await delay(400)
      let hotels = [...getHotels()]

      // Apply filters
      if (filters.region) {
        hotels = hotels.filter((h) => h.region === filters.region)
      }
      if (filters.status && filters.status.length > 0) {
        hotels = hotels.filter((h) => filters.status!.includes(h.status))
      }
      if (filters.assignee) {
        if (filters.assignee === 'me') {
          // In real app, get current user ID
          hotels = hotels.filter((h) => h.assignee === '2')
        } else if (filters.assignee !== 'all') {
          hotels = hotels.filter((h) => h.assignee === filters.assignee)
        }
      }
      if (filters.followUpFilter) {
        const today = new Date()
        const weekStart = startOfWeek(today)
        const weekEnd = endOfWeek(today)
        hotels = hotels.filter((h) => {
          if (!h.nextFollowUpDate) return filters.followUpFilter === 'all'
          const followUpDate = parseISO(h.nextFollowUpDate)
          switch (filters.followUpFilter) {
            case 'today':
              return isToday(followUpDate)
            case 'thisWeek':
              return followUpDate >= weekStart && followUpDate <= weekEnd
            case 'overdue':
              return isBefore(followUpDate, today) && !isToday(followUpDate)
            default:
              return true
          }
        })
      }

      const totalCount = hotels.length
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedHotels = hotels.slice(start, end)

      return {
        data: paginatedHotels,
        totalCount,
        page,
        pageSize,
      }
    },
  })
}

export function useHotelDetail(hotelId: string | null) {
  return useQuery<Hotel | null>({
    queryKey: ['hotels', 'detail', hotelId],
    queryFn: async () => {
      if (!hotelId) return null
      await delay(200)
      const hotels = getHotels()
      return hotels.find((h) => h.id === hotelId) || null
    },
    enabled: !!hotelId,
  })
}

export function useHotelNotes(hotelId: string | null) {
  return useQuery<Note[]>({
    queryKey: ['hotels', 'notes', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      await delay(200)
      const notes = getNotes()
      return notes.filter((n) => n.hotelId === hotelId).sort((a, b) => {
        return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
      })
    },
    enabled: !!hotelId,
  })
}

export function useHotelActivity(hotelId: string | null) {
  return useQuery<ActivityLog[]>({
    queryKey: ['hotels', 'activity', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      await delay(200)
      const logs = getActivityLogs()
      return logs
        .filter((l) => l.hotelId === hotelId)
        .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
    },
    enabled: !!hotelId,
  })
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      await delay(100)
      return mockUsers
    },
  })
}

// Mutations
export function useUpdateHotelStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, status }: { hotelId: string; status: HotelStatus }) => {
      await delay(300)
      const hotels = getHotels()
      const hotel = hotels.find((h) => h.id === hotelId)
      if (!hotel) throw new Error('Hotel not found')

      const oldStatus = hotel.status
      hotel.status = status
      hotel.lastUpdatedAt = new Date().toISOString()
      setHotels(hotels)

      // Add activity log
      addActivityLog({
        id: Date.now().toString(),
        hotelId,
        userId: '2', // In real app, get from auth
        userName: 'Current User',
        action: 'status_changed',
        oldStatus,
        newStatus: status,
        createdAt: new Date().toISOString(),
      })

      return hotel
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateHotelAssignee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, assigneeId }: { hotelId: string; assigneeId: string | null }) => {
      await delay(300)
      const hotels = getHotels()
      const hotel = hotels.find((h) => h.id === hotelId)
      if (!hotel) throw new Error('Hotel not found')

      hotel.assignee = assigneeId
      hotel.lastUpdatedAt = new Date().toISOString()
      setHotels(hotels)

      return hotel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
    },
  })
}

export function useUpdateHotelFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, date }: { hotelId: string; date: string | null }) => {
      await delay(300)
      const hotels = getHotels()
      const hotel = hotels.find((h) => h.id === hotelId)
      if (!hotel) throw new Error('Hotel not found')

      hotel.nextFollowUpDate = date
      hotel.lastUpdatedAt = new Date().toISOString()
      setHotels(hotels)

      return hotel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, content }: { hotelId: string; content: string }) => {
      await delay(300)
      const note: Note = {
        id: Date.now().toString(),
        hotelId,
        authorName: 'Current User',
        createdAt: new Date().toISOString(),
        content,
      }
      addNote(note)
      return note
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hotels', 'notes', data.hotelId] })
    },
  })
}

export function useBulkUpdateHotels() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      hotelIds,
      updates,
    }: {
      hotelIds: string[]
      updates: { status?: HotelStatus; assignee?: string | null; nextFollowUpDate?: string | null }
    }) => {
      await delay(500)
      const hotels = getHotels()
      hotels.forEach((hotel) => {
        if (hotelIds.includes(hotel.id)) {
          if (updates.status) hotel.status = updates.status
          if (updates.assignee !== undefined) hotel.assignee = updates.assignee
          if (updates.nextFollowUpDate !== undefined) hotel.nextFollowUpDate = updates.nextFollowUpDate
          hotel.lastUpdatedAt = new Date().toISOString()
        }
      })
      setHotels(hotels)
      return { updated: hotelIds.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateHotel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (hotelData: Partial<Hotel>) => {
      await delay(500)
      const existingHotels = getHotels()
      const hotel: Hotel = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        hotelName: hotelData.hotelName || '',
        region: hotelData.region || '',
        address: hotelData.address || '',
        phone: hotelData.phone || '',
        email: hotelData.email || '',
        website: hotelData.website || '',
        status: hotelData.status || 'NEW',
        assignee: hotelData.assignee || null,
        nextFollowUpDate: hotelData.nextFollowUpDate || null,
        lastUpdatedAt: new Date().toISOString(),
      }
      existingHotels.push(hotel)
      setHotels(existingHotels)

      // Add activity log
      addActivityLog({
        id: Date.now().toString(),
        hotelId: hotel.id,
        userId: '2', // In real app, get from auth
        userName: 'Current User',
        action: 'created',
        createdAt: new Date().toISOString(),
      })

      return hotel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useImportHotels() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (hotels: Partial<Hotel>[]) => {
      await delay(1000)
      const existingHotels = getHotels()
      let created = 0
      let updated = 0
      let skipped = 0

      hotels.forEach((newHotel) => {
        const existing = existingHotels.find(
          (h) => h.hotelName === newHotel.hotelName && h.region === newHotel.region
        )
        if (existing) {
          // Update existing
          Object.assign(existing, newHotel, { id: existing.id })
          updated++
        } else {
          // Create new
          const hotel: Hotel = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            hotelName: newHotel.hotelName || '',
            region: newHotel.region || '',
            address: newHotel.address || '',
            phone: newHotel.phone || '',
            email: newHotel.email || '',
            website: newHotel.website || '',
            status: 'NEW',
            assignee: null,
            nextFollowUpDate: null,
            lastUpdatedAt: new Date().toISOString(),
          }
          existingHotels.push(hotel)
          created++
        }
      })

      setHotels(existingHotels)
      return { created, updated, skipped }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

