import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/hotels/[id] - Get hotel detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDbPool()
    const result = await db.query('SELECT * FROM hotels WHERE id = $1', [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const hotel = result.rows[0]
    return NextResponse.json({
      id: hotel.id,
      hotelName: hotel.hotel_name,
      region: hotel.region,
      address: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      website: hotel.website || '',
      status: hotel.status,
      assignee: hotel.assignee_id,
      nextFollowUpDate: hotel.next_follow_up_date,
      lastUpdatedAt: hotel.last_updated_at,
    })
  } catch (error: any) {
    console.error('Error fetching hotel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/hotels/[id] - Update hotel
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const db = getDbPool()

    // Get current hotel state
    const currentResult = await db.query('SELECT * FROM hotels WHERE id = $1', [params.id])
    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const currentHotel = currentResult.rows[0]
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build dynamic update query
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }
    if (body.assignee !== undefined) {
      updates.push(`assignee_id = $${paramIndex}`)
      values.push(body.assignee || null)
      paramIndex++
    }
    if (body.nextFollowUpDate !== undefined) {
      updates.push(`next_follow_up_date = $${paramIndex}`)
      values.push(body.nextFollowUpDate || null)
      paramIndex++
    }
    if (body.hotelName !== undefined) {
      updates.push(`hotel_name = $${paramIndex}`)
      values.push(body.hotelName)
      paramIndex++
    }
    if (body.region !== undefined) {
      updates.push(`region = $${paramIndex}`)
      values.push(body.region)
      paramIndex++
    }
    if (body.address !== undefined) {
      updates.push(`address = $${paramIndex}`)
      values.push(body.address || null)
      paramIndex++
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`)
      values.push(body.phone || null)
      paramIndex++
    }
    if (body.email !== undefined) {
      updates.push(`email = $${paramIndex}`)
      values.push(body.email || null)
      paramIndex++
    }
    if (body.website !== undefined) {
      updates.push(`website = $${paramIndex}`)
      values.push(body.website || null)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Always update last_updated_at
    updates.push(`last_updated_at = CURRENT_TIMESTAMP`)
    values.push(params.id)
    const updateQuery = `UPDATE hotels SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    const result = await db.query(updateQuery, values)

    const updatedHotel = result.rows[0]

    // Create activity log for status changes
    if (body.status !== undefined && body.status !== currentHotel.status) {
      await db.query(
        `INSERT INTO activity_logs (id, hotel_id, user_id, user_name, action, old_status, new_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          randomUUID(),
          params.id,
          body.userId || null,
          body.userName || 'System',
          'status_changed',
          currentHotel.status,
          body.status,
          new Date().toISOString(),
        ]
      )
    }

    return NextResponse.json({
      id: updatedHotel.id,
      hotelName: updatedHotel.hotel_name,
      region: updatedHotel.region,
      address: updatedHotel.address || '',
      phone: updatedHotel.phone || '',
      email: updatedHotel.email || '',
      website: updatedHotel.website || '',
      status: updatedHotel.status,
      assignee: updatedHotel.assignee_id,
      nextFollowUpDate: updatedHotel.next_follow_up_date,
      lastUpdatedAt: updatedHotel.last_updated_at,
    })
  } catch (error: any) {
    console.error('Error updating hotel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

