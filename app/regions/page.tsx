'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion } from '@/hooks/useRegions'
import { useHotelList } from '@/hooks/useMockQueries'

export default function RegionsPage() {
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newRegion, setNewRegion] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: regions, isLoading } = useRegions()
  const createRegionMutation = useCreateRegion()
  const updateRegionMutation = useUpdateRegion()
  const deleteRegionMutation = useDeleteRegion()

  const handleCreate = async () => {
    const regionToAdd = newRegion.trim()
    
    if (!regionToAdd) {
      alert('Please enter a region name')
      return
    }
    
    if (regions?.includes(regionToAdd)) {
      alert('Region already exists')
      return
    }
    
    console.log('Creating region:', regionToAdd)
    
    try {
      const result = await createRegionMutation.mutateAsync(regionToAdd)
      console.log('Region created successfully:', result)
      setNewRegion('')
      // Close modal after successful creation
      setTimeout(() => {
        setShowAddForm(false)
      }, 500)
      // The mutation will automatically invalidate queries and refresh the list
    } catch (error: any) {
      console.error('Error creating region:', error)
      const errorMessage = error?.message || error?.error || 'Unknown error occurred'
      // Don't close modal on error, let user see the error message
    }
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

  // Get all hotels to check region usage
  const { data: allHotelsData } = useHotelList({}, 1, 10000) // Get all hotels
  const allHotels = allHotelsData?.data || []

  const handleDelete = async (region: string) => {
    // Check if any hotels use this region
    const hotelsInRegion = allHotels.filter((h) => h.region === region)
    
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
    return allHotels.filter((h) => h.region === region).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Regions Management" breadcrumb={['Home', 'Regions']} />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header with Add Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Regions Management</h2>
            <Button
              onClick={() => {
                setNewRegion('')
                setShowAddForm(true)
              }}
              variant="primary"
            >
              + Add Region
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

        {/* Add Region Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Region</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region Name
                  </label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newRegion.trim() && !createRegionMutation.isPending) {
                        e.preventDefault()
                        handleCreate()
                      }
                    }}
                    placeholder="Enter region name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={createRegionMutation.isPending}
                    autoFocus
                  />
                </div>
                
                {createRegionMutation.isError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Error:</p>
                    <p className="text-sm text-red-600 mt-1">
                      {createRegionMutation.error?.message || 'Failed to add region'}
                    </p>
                  </div>
                )}
                
                {createRegionMutation.isSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">✓ Region added successfully!</p>
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewRegion('')
                    }}
                    variant="outline"
                    disabled={createRegionMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newRegion.trim() && !createRegionMutation.isPending) {
                        handleCreate().then(() => {
                          // Close modal on success
                          if (!createRegionMutation.isError) {
                            setTimeout(() => {
                              setShowAddForm(false)
                              setNewRegion('')
                            }, 1000)
                          }
                        })
                      }
                    }}
                    disabled={!newRegion.trim() || createRegionMutation.isPending}
                    variant="primary"
                  >
                    {createRegionMutation.isPending ? 'Adding...' : 'Add Region'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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


