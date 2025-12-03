import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { HotelStatus } from '@/lib/types'

// GET /api/dashboard/summary - Get dashboard summary
export async function GET(request: NextRequest) {
  try {
    const db = getDbPool()
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available. Ensure a supported driver is installed (pg or better-sqlite3) and environment is configured.' },
        { status: 503 }
      )
    }

    // Get all hotels
    const hotelsResult = await db.query('SELECT status, region FROM hotels')
    const hotels = hotelsResult.rows

    // Initialize status distribution
    const statusDistribution: Record<HotelStatus, number> = {
      NEW: 0,
      CALLING: 0,
      NO_ANSWER: 0,
      NOT_INTERESTED: 0,
      INTERESTED: 0,
      DEMO_BOOKED: 0,
      SIGNED: 0,
    }

    // Initialize region status matrix
    const regionStatusMatrix: Record<string, Record<HotelStatus, number>> = {}

    hotels.forEach((hotel) => {
      const status = hotel.status as HotelStatus
      statusDistribution[status]++

      const region = hotel.region || 'Unknown'
      if (!regionStatusMatrix[region]) {
        regionStatusMatrix[region] = {
          NEW: 0,
          CALLING: 0,
          NO_ANSWER: 0,
          NOT_INTERESTED: 0,
          INTERESTED: 0,
          DEMO_BOOKED: 0,
          SIGNED: 0,
        }
      }
      regionStatusMatrix[region][status]++
    })

    return NextResponse.json({
      totalHotels: hotels.length,
      newHotels: statusDistribution.NEW,
      interestedHotels: statusDistribution.INTERESTED + statusDistribution.DEMO_BOOKED,
      signedHotels: statusDistribution.SIGNED,
      statusDistribution,
      regionStatusMatrix,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

