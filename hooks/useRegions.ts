'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRegions, addRegion, updateRegion, deleteRegion } from '@/lib/mockData'

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useRegions() {
  return useQuery<string[]>({
    queryKey: ['regions'],
    queryFn: async () => {
      await delay(200)
      return getRegions()
    },
  })
}

export function useCreateRegion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (region: string) => {
      await delay(300)
      addRegion(region)
      return region
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
      await delay(300)
      updateRegion(oldRegion, newRegion)
      return { oldRegion, newRegion }
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
      await delay(300)
      deleteRegion(region)
      return region
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] })
      queryClient.invalidateQueries({ queryKey: ['hotels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}


