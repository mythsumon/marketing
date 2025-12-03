'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  console.log('API POST:', url, data)
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  console.log('API Response status:', response.status)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('API Error:', errorData)
    throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  const result = await response.json()
  console.log('API Success:', result)
  return result
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

export function useRegions() {
  return useQuery<string[]>({
    queryKey: ['regions'],
    queryFn: () => apiGet<string[]>('/api/regions'),
  })
}

export function useCreateRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (region: string) => {
      return apiPost<string>('/api/regions', { region })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ oldRegion, newRegion }: { oldRegion: string; newRegion: string }) => {
      return apiPatch<{ oldRegion: string; newRegion: string }>('/api/regions', { oldRegion, newRegion })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (region: string) => {
      return apiDelete<string>(`/api/regions?region=${encodeURIComponent(region)}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
