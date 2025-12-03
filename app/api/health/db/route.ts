import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'

export async function GET() {
  try {
    // Check if pg is installed
    let pgInstalled = false
    try {
      require('pg')
      pgInstalled = true
    } catch (e) {
      pgInstalled = false
    }

    // Check environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasDbParams = !!(process.env.DB_HOST || process.env.DB_USER)

    const isConnected = await testConnection()
    
    if (isConnected) {
      return NextResponse.json(
        { 
          status: 'ok', 
          message: 'Database connected successfully',
          pgInstalled,
          hasDatabaseUrl,
          hasDbParams
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          pgInstalled,
          hasDatabaseUrl,
          hasDbParams,
          envCheck: {
            DATABASE_URL: hasDatabaseUrl ? 'Set' : 'Not set',
            DB_HOST: process.env.DB_HOST || 'Not set',
            DB_PORT: process.env.DB_PORT || 'Not set',
            DB_NAME: process.env.DB_NAME || 'Not set',
            DB_USER: process.env.DB_USER || 'Not set',
            DB_PASSWORD: process.env.DB_PASSWORD ? 'Set' : 'Not set'
          }
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Database connection error',
        errorDetails: error.toString(),
        pgInstalled: (() => {
          try {
            require('pg')
            return true
          } catch {
            return false
          }
        })()
      },
      { status: 500 }
    )
  }
}


