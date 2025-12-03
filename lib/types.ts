export type HotelStatus =
  | 'NEW'
  | 'CALLING'
  | 'NO_ANSWER'
  | 'NOT_INTERESTED'
  | 'INTERESTED'
  | 'DEMO_BOOKED'
  | 'SIGNED'

export type UserRole = 'admin' | 'caller'

export interface Hotel {
  id: string
  hotelName: string
  region: string
  address: string
  phone: string
  email: string
  website: string
  status: HotelStatus
  assignee: string | null
  nextFollowUpDate: string | null
  lastUpdatedAt: string
}

export interface Note {
  id: string
  hotelId: string
  authorName: string
  createdAt: string
  content: string
}

export interface User {
  id: string
  name: string
  role: UserRole
}

export interface ActivityLog {
  id: string
  hotelId: string
  userId: string
  userName: string
  action: string
  oldStatus?: HotelStatus
  newStatus?: HotelStatus
  createdAt: string
}

export interface DashboardSummary {
  totalHotels: number
  newHotels: number
  interestedHotels: number
  signedHotels: number
  statusDistribution: Record<HotelStatus, number>
  regionStatusMatrix: Record<string, Record<HotelStatus, number>>
}

export interface HotelListFilters {
  region?: string
  status?: HotelStatus[]
  assignee?: string
  followUpFilter?: 'all' | 'today' | 'thisWeek' | 'overdue'
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
}


