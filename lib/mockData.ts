import { Hotel, User, Note, ActivityLog, HotelStatus } from './types'

// Mock users
export const mockUsers: User[] = [
  { id: '1', name: 'John Admin', role: 'admin' },
  { id: '2', name: 'Sarah Caller', role: 'caller' },
  { id: '3', name: 'Mike Sales', role: 'caller' },
  { id: '4', name: 'Emma Manager', role: 'admin' },
]

// Mock regions (Myanmar) - now with CRUD support
let regionsStorage: string[] = ['Yangon', 'Mandalay', 'Bagan', 'Inle', 'Naypyidaw', 'Mawlamyine']

export const getRegions = () => [...regionsStorage]
export const addRegion = (region: string) => {
  if (!regionsStorage.includes(region)) {
    regionsStorage.push(region)
  }
}
export const updateRegion = (oldRegion: string, newRegion: string) => {
  const index = regionsStorage.indexOf(oldRegion)
  if (index !== -1 && !regionsStorage.includes(newRegion)) {
    regionsStorage[index] = newRegion
    // Update all hotels with this region
    const hotels = getHotels()
    hotels.forEach((hotel) => {
      if (hotel.region === oldRegion) {
        hotel.region = newRegion
      }
    })
    setHotels(hotels)
  }
}
export const deleteRegion = (region: string) => {
  regionsStorage = regionsStorage.filter((r) => r !== region)
}

// For backward compatibility
export const regions = getRegions()

// Mock hotels - empty by default
export const mockHotels: Hotel[] = []

// Mock notes - empty by default
export const mockNotes: Note[] = []

// Mock activity logs - empty by default
export const mockActivityLogs: ActivityLog[] = []

// In-memory storage (simulating backend)
let hotelsStorage: Hotel[] = []
let notesStorage: Note[] = []
let activityLogsStorage: ActivityLog[] = []

export const getHotels = () => hotelsStorage
export const setHotels = (hotels: Hotel[]) => {
  hotelsStorage = hotels
}
export const getNotes = () => notesStorage
export const addNote = (note: Note) => {
  notesStorage.push(note)
}
export const getActivityLogs = () => activityLogsStorage
export const addActivityLog = (log: ActivityLog) => {
  activityLogsStorage.push(log)
}

