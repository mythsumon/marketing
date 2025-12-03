import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

// GET /api/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const db = getDbPool()
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available. Ensure a supported driver is installed (pg or better-sqlite3) and environment is configured.' },
        { status: 503 }
      )
    }
    const result = await db.query('SELECT id, name, role FROM users ORDER BY name')

    const users = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
    }))

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching users:', error)
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

