import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

// POST /api/hotels/bulk - Bulk update hotels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hotelIds, updates } = body

    if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
      return NextResponse.json({ error: 'hotelIds array is required' }, { status: 400 })
    }

    const db = getDbPool()
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(updates.status)
      paramIndex++
    }
    if (updates.assignee !== undefined) {
      updateFields.push(`assignee_id = $${paramIndex}`)
      values.push(updates.assignee || null)
      paramIndex++
    }
    if (updates.nextFollowUpDate !== undefined) {
      updateFields.push(`next_follow_up_date = $${paramIndex}`)
      values.push(updates.nextFollowUpDate || null)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Always update last_updated_at
    updateFields.push(`last_updated_at = CURRENT_TIMESTAMP`)
    // Build query with array of IDs
    values.push(hotelIds)
    const query = `UPDATE hotels SET ${updateFields.join(', ')} WHERE id = ANY($${paramIndex}) RETURNING id`
    await db.query(query, values)

    return NextResponse.json({ updated: hotelIds.length })
  } catch (error: any) {
    console.error('Error bulk updating hotels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

