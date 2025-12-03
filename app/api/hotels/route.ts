import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/hotels - List hotels with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const db = getDbPool()
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available. Ensure a supported driver is installed (pg or better-sqlite3) and environment is configured.' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const region = searchParams.get('region')
    const status = searchParams.getAll('status')
    const assignee = searchParams.get('assignee')
    const followUpFilter = searchParams.get('followUpFilter') || 'all'

    // db already obtained above
    let query = 'SELECT * FROM hotels WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    // Apply filters
    if (region) {
      query += ` AND region = $${paramIndex}`
      params.push(region)
      paramIndex++
    }

    if (status.length > 0) {
      query += ` AND status = ANY($${paramIndex})`
      params.push(status)
      paramIndex++
    }

    if (assignee && assignee !== 'all') {
      if (assignee === 'me') {
        // In real app, get current user ID from auth
        // For now, we'll skip this filter or use a placeholder
        query += ` AND assignee_id IS NOT NULL`
      } else {
        query += ` AND assignee_id = $${paramIndex}`
        params.push(assignee)
        paramIndex++
      }
    }

    // Follow-up filter
    if (followUpFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0]
      switch (followUpFilter) {
        case 'today':
          query += ` AND next_follow_up_date = $${paramIndex}`
          params.push(today)
          paramIndex++
          break
        case 'thisWeek':
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          query += ` AND next_follow_up_date >= $${paramIndex} AND next_follow_up_date <= $${paramIndex + 1}`
          params.push(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0])
          paramIndex += 2
          break
        case 'overdue':
          query += ` AND next_follow_up_date < $${paramIndex}`
          params.push(today)
          paramIndex++
          break
      }
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)')
    const countResult = await db.query(countQuery, params)
    const totalCount = parseInt(countResult.rows[0].count)

    // Add pagination
    query += ` ORDER BY last_updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(pageSize, (page - 1) * pageSize)

    const result = await db.query(query, params)

    // Transform to match frontend types
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

    return NextResponse.json({
      data: hotels,
      totalCount,
      page,
      pageSize,
    })
  } catch (error: any) {
    console.error('Error fetching hotels:', error)
    const errorMessage = error.message || 'Unknown error occurred'
    if (errorMessage.includes('pg') || errorMessage.includes('MODULE_NOT_FOUND')) {
      return NextResponse.json(
        { 
          error: 'Database package not installed. Please run: npm install pg',
          details: errorMessage 
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/hotels - Create a new hotel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = getDbPool()

    const hotelId = randomUUID()
    const now = new Date().toISOString()

    const result = await db.query(
      `INSERT INTO hotels (id, hotel_name, region, address, phone, email, website, status, assignee_id, next_follow_up_date, created_at, last_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        hotelId,
        body.hotelName || '',
        body.region || '',
        body.address || null,
        body.phone || null,
        body.email || null,
        body.website || null,
        body.status || 'NEW',
        body.assignee || null,
        body.nextFollowUpDate || null,
        now,
        now,
      ]
    )

    const hotel = result.rows[0]

    // Create activity log
    await db.query(
      `INSERT INTO activity_logs (id, hotel_id, user_id, user_name, action, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), hotelId, body.userId || null, body.userName || 'System', 'created', now]
    )

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
    console.error('Error creating hotel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

