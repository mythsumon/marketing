import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

// GET /api/dashboard/followups - Get upcoming follow-ups
export async function GET(request: NextRequest) {
  try {
    const db = getDbPool()
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available. Ensure a supported driver is installed (pg or better-sqlite3) and environment is configured.' },
        { status: 503 }
      )
    }
    const today = new Date().toISOString().split('T')[0]

    // Get hotels with follow-up dates today or earlier
    const result = await db.query(
      `SELECT * FROM hotels 
       WHERE next_follow_up_date IS NOT NULL 
       AND next_follow_up_date <= $1 
       ORDER BY next_follow_up_date ASC`,
      [today]
    )

    const hotels = result.rows.map((row) => ({
      id: row.id,
      hotelName: row.hotel_name,
      region: row.region,
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      website: row.website || '',
      status: row.status,
      assignee: row.assignee_id,
      nextFollowUpDate: row.next_follow_up_date,
      lastUpdatedAt: row.last_updated_at,
    }))

    return NextResponse.json(hotels)
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

