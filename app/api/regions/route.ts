import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

// GET /api/regions - Get all regions
export async function GET(request: NextRequest) {
  try {
    // Check if pg is installed first
    try {
      require('pg')
    } catch (e: any) {
      return NextResponse.json(
        { 
          error: 'PostgreSQL client (pg) is not installed',
          message: 'Please run: npm install pg',
          details: e.message
        },
        { status: 500 }
      )
    }

    const db = getDbPool()
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available. Ensure a supported driver is installed (pg or better-sqlite3) and environment is configured.' },
        { status: 503 }
      )
    }
    const result = await db.query('SELECT DISTINCT name FROM regions ORDER BY name')

    const regions = result.rows.map((row) => row.name)

    // Also get unique regions from hotels table (in case some hotels have regions not in regions table)
    const hotelRegionsResult = await db.query('SELECT DISTINCT region FROM hotels WHERE region IS NOT NULL ORDER BY region')
    const hotelRegions = hotelRegionsResult.rows.map((row) => row.region)

    // Combine and deduplicate
    const allRegions = Array.from(new Set([...regions, ...hotelRegions])).sort()

    return NextResponse.json(allRegions)
  } catch (error: any) {
    console.error('Error fetching regions:', error)
    const errorMessage = error.message || 'Unknown error occurred'
    // Provide helpful error message if pg is not installed
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

// POST /api/regions - Create a new region
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/regions - Creating region')
    
    // Check if pg is installed first
    try {
      require('pg')
    } catch (e: any) {
      console.error('pg module not found:', e)
      return NextResponse.json(
        { 
          error: 'PostgreSQL client (pg) is not installed',
          message: 'Please run: npm install pg',
          details: e.message
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    const regionName = body.region || body.name

    if (!regionName || !regionName.trim()) {
      return NextResponse.json({ error: 'Region name is required' }, { status: 400 })
    }

    const db = getDbPool()
    if (!db) {
      console.error('Database pool is null')
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      )
    }

    console.log('Checking if region exists:', regionName)
    // Check if region already exists
    const existing = await db.query('SELECT id FROM regions WHERE name = $1', [regionName.trim()])
    if (existing.rows.length > 0) {
      console.log('Region already exists, returning existing')
      return NextResponse.json(regionName.trim())
    }

    console.log('Inserting new region:', regionName.trim())
    await db.query('INSERT INTO regions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [regionName.trim()])

    console.log('Region created successfully:', regionName.trim())
    return NextResponse.json(regionName.trim())
  } catch (error: any) {
    console.error('Error creating region:', error)
    console.error('Error stack:', error.stack)
    const errorMessage = error.message || 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.toString(),
        code: error.code
      },
      { status: 500 }
    )
  }
}

// PATCH /api/regions - Update a region name
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { oldRegion, newRegion } = body

    if (!oldRegion || !newRegion) {
      return NextResponse.json({ error: 'oldRegion and newRegion are required' }, { status: 400 })
    }

    const db = getDbPool()

    // Update region in regions table
    await db.query('UPDATE regions SET name = $1 WHERE name = $2', [newRegion, oldRegion])

    // Update region in hotels table
    await db.query('UPDATE hotels SET region = $1 WHERE region = $2', [newRegion, oldRegion])

    return NextResponse.json({ oldRegion, newRegion })
  } catch (error: any) {
    console.error('Error updating region:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/regions - Delete a region
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionName = searchParams.get('region')

    if (!regionName) {
      return NextResponse.json({ error: 'Region name is required' }, { status: 400 })
    }

    const db = getDbPool()

    // Delete from regions table
    await db.query('DELETE FROM regions WHERE name = $1', [regionName])

    // Note: We don't delete hotels with this region, just remove the region reference
    // If you want to delete hotels too, uncomment:
    // await db.query('DELETE FROM hotels WHERE region = $1', [regionName])

    return NextResponse.json(regionName)
  } catch (error: any) {
    console.error('Error deleting region:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

