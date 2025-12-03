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

// API helper functions
async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

async function apiPost<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

async function apiPatch<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Dashboard hooks
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiGet<DashboardSummary>('/api/dashboard/summary'),
  })
}

export function useUpcomingFollowUps() {
  return useQuery<Hotel[]>({
    queryKey: ['dashboard', 'followups'],
    queryFn: () => apiGet<Hotel[]>('/api/dashboard/followups'),
  })
}

// Hotel list hooks
export function useHotelList(filters: HotelListFilters = {}, page: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedResponse<Hotel>>({
    queryKey: ['hotels', 'list', filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      
      if (filters.region) params.set('region', filters.region)
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => params.append('status', status))
      }
      if (filters.assignee) params.set('assignee', filters.assignee)
      if (filters.followUpFilter) params.set('followUpFilter', filters.followUpFilter)
      
      return apiGet<PaginatedResponse<Hotel>>(`/api/hotels?${params.toString()}`)
    },
  })
}

export function useHotelDetail(hotelId: string | null) {
  return useQuery<Hotel | null>({
    queryKey: ['hotels', 'detail', hotelId],
    queryFn: async () => {
      if (!hotelId) return null
      return apiGet<Hotel>(`/api/hotels/${hotelId}`)
    },
    enabled: !!hotelId,
  })
}

export function useHotelNotes(hotelId: string | null) {
  return useQuery<Note[]>({
    queryKey: ['hotels', 'notes', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      return apiGet<Note[]>(`/api/hotels/${hotelId}/notes`)
    },
    enabled: !!hotelId,
  })
}

export function useHotelActivity(hotelId: string | null) {
  return useQuery<ActivityLog[]>({
    queryKey: ['hotels', 'activity', hotelId],
    queryFn: async () => {
      if (!hotelId) return []
      return apiGet<ActivityLog[]>(`/api/hotels/${hotelId}/activity`)
    },
    enabled: !!hotelId,
  })
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiGet<User[]>('/api/users'),
  })
}

// Mutations
export function useUpdateHotelStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, status, userId, userName }: { hotelId: string; status: HotelStatus; userId?: string; userName?: string }) => {
      return apiPatch<Hotel>(`/api/hotels/${hotelId}`, {
        status,
        userId: userId || null,
        userName: userName || 'System',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateHotelAssignee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ hotelId, assigneeId }: { hotelId: string; assigneeId: string | null }) => {
      return apiPatch<Hotel>(`/api/hotels/${hotelId}`, { assignee: assigneeId })
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
      return apiPatch<Hotel>(`/api/hotels/${hotelId}`, { nextFollowUpDate: date })
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
    mutationFn: async ({ hotelId, content, authorName }: { hotelId: string; content: string; authorName?: string }) => {
      return apiPost<Note>(`/api/hotels/${hotelId}/notes`, {
        content,
        authorName: authorName || 'System',
      })
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
      return apiPost<{ updated: number }>('/api/hotels/bulk', { hotelIds, updates })
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
    mutationFn: async (hotelData: Partial<Hotel> & { userId?: string; userName?: string }) => {
      return apiPost<Hotel>('/api/hotels', {
        hotelName: hotelData.hotelName || '',
        region: hotelData.region || '',
        address: hotelData.address || '',
        phone: hotelData.phone || '',
        email: hotelData.email || '',
        website: hotelData.website || '',
        status: hotelData.status || 'NEW',
        assignee: hotelData.assignee || null,
        nextFollowUpDate: hotelData.nextFollowUpDate || null,
        userId: hotelData.userId || null,
        userName: hotelData.userName || 'System',
      })
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
      return apiPost<{ created: number; updated: number; skipped: number }>('/api/hotels/import', { hotels })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
