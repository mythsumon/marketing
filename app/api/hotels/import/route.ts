import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { randomUUID } from 'crypto'

// POST /api/hotels/import - Import hotels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const hotels = body.hotels || []

    if (!Array.isArray(hotels)) {
      return NextResponse.json({ error: 'hotels must be an array' }, { status: 400 })
    }

    const db = getDbPool()
    let created = 0
    let updated = 0
    const now = new Date().toISOString()

    for (const hotelData of hotels) {
      // Check if hotel exists (by name and region)
      const existingResult = await db.query(
        'SELECT id FROM hotels WHERE hotel_name = $1 AND region = $2',
        [hotelData.hotelName || '', hotelData.region || '']
      )

      if (existingResult.rows.length > 0) {
        // Update existing
        const hotelId = existingResult.rows[0].id
        await db.query(
          `UPDATE hotels SET 
           hotel_name = $1, region = $2, address = $3, phone = $4, email = $5, website = $6
           WHERE id = $7`,
          [
            hotelData.hotelName || '',
            hotelData.region || '',
            hotelData.address || null,
            hotelData.phone || null,
            hotelData.email || null,
            hotelData.website || null,
            hotelId,
          ]
        )
        updated++
      } else {
        // Create new
        const hotelId = randomUUID()
        await db.query(
          `INSERT INTO hotels (id, hotel_name, region, address, phone, email, website, status, assignee_id, next_follow_up_date, created_at, last_updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            hotelId,
            hotelData.hotelName || '',
            hotelData.region || '',
            hotelData.address || null,
            hotelData.phone || null,
            hotelData.email || null,
            hotelData.website || null,
            'NEW',
            null,
            null,
            now,
            now,
          ]
        )
        created++
      }
    }

    return NextResponse.json({ created, updated, skipped: 0 })
  } catch (error: any) {
    console.error('Error importing hotels:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

