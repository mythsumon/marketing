import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

// GET /api/hotels/[id]/activity - Get activity logs for a hotel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDbPool()
    const result = await db.query(
      'SELECT * FROM activity_logs WHERE hotel_id = $1 ORDER BY created_at DESC',
      [params.id]
    )

    const logs = result.rows.map((row) => ({
      id: row.id,
      hotelId: row.hotel_id,
      userId: row.user_id,
      userName: row.user_name,
      action: row.action,
      oldStatus: row.old_status,
      newStatus: row.new_status,
      createdAt: row.created_at,
    }))

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

