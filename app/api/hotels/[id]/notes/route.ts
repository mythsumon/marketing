import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET /api/hotels/[id]/notes - Get notes for a hotel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDbPool()
    const result = await db.query(
      'SELECT * FROM notes WHERE hotel_id = $1 ORDER BY created_at DESC',
      [params.id]
    )

    const notes = result.rows.map((row) => ({
      id: row.id,
      hotelId: row.hotel_id,
      authorName: row.author_name,
      content: row.content,
      createdAt: row.created_at,
    }))

    return NextResponse.json(notes)
  } catch (error: any) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/hotels/[id]/notes - Create a note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const db = getDbPool()

    const noteId = randomUUID()
    const now = new Date().toISOString()

    const result = await db.query(
      `INSERT INTO notes (id, hotel_id, author_name, content, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [noteId, params.id, body.authorName || 'System', body.content, now]
    )

    const note = result.rows[0]
    return NextResponse.json({
      id: note.id,
      hotelId: note.hotel_id,
      authorName: note.author_name,
      content: note.content,
      createdAt: note.created_at,
    })
  } catch (error: any) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

