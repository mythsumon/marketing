'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion } from '@/hooks/useRegions'
import { getHotels } from '@/lib/mockData'

export default function RegionsPage() {
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newRegion, setNewRegion] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const { data: regions, isLoading } = useRegions()
  const createRegionMutation = useCreateRegion()
  const updateRegionMutation = useUpdateRegion()
  const deleteRegionMutation = useDeleteRegion()

  const handleCreate = async () => {
    if (!newRegion.trim()) return
    if (regions?.includes(newRegion.trim())) {
      alert('Region already exists')
      return
    }
    await createRegionMutation.mutateAsync(newRegion.trim())
    setNewRegion('')
  }

  const handleStartEdit = (region: string) => {
    setEditingRegion(region)
    setEditValue(region)
  }

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !editingRegion) return
    if (editValue.trim() === editingRegion) {
      setEditingRegion(null)
      return
    }
    if (regions?.includes(editValue.trim()) && editValue.trim() !== editingRegion) {
      alert('Region already exists')
      return
    }
    await updateRegionMutation.mutateAsync({
      oldRegion: editingRegion,
      newRegion: editValue.trim(),
    })
    setEditingRegion(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingRegion(null)
    setEditValue('')
  }

  const handleDelete = async (region: string) => {
    // Check if any hotels use this region
    const hotels = getHotels()
    const hotelsInRegion = hotels.filter((h) => h.region === region)
    
    if (hotelsInRegion.length > 0) {
      alert(
        `Cannot delete region "${region}" because ${hotelsInRegion.length} hotel(s) are using it. Please reassign those hotels first.`
      )
      setShowDeleteConfirm(null)
      return
    }

    await deleteRegionMutation.mutateAsync(region)
    setShowDeleteConfirm(null)
  }

  const getHotelCount = (region: string) => {
    const hotels = getHotels()
    return hotels.filter((h) => h.region === region).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Regions Management" breadcrumb={['Home', 'Regions']} />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Create New Region */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Region</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter region name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Button
              onClick={handleCreate}
              disabled={!newRegion.trim() || createRegionMutation.isPending}
            >
              {createRegionMutation.isPending ? 'Adding...' : 'Add Region'}
            </Button>
          </div>
        </div>

        {/* Regions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Regions</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : regions && regions.length > 0 ? (
            <div className="space-y-2">
              {regions.map((region) => (
                <div
                  key={region}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {editingRegion === region ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        autoFocus
                      />
                      <Button onClick={handleSaveEdit} size="sm" disabled={updateRegionMutation.isPending}>
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{region}</span>
                          <span className="text-sm text-gray-500">
                            ({getHotelCount(region)} hotel{getHotelCount(region) !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleStartEdit(region)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(region)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No regions found</div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Region</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete "{showDeleteConfirm}"? This action cannot be undone.
                {getHotelCount(showDeleteConfirm) > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    Warning: {getHotelCount(showDeleteConfirm)} hotel(s) are using this region.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  disabled={deleteRegionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  variant="primary"
                  disabled={deleteRegionMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteRegionMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


