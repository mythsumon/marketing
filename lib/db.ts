// Use require to avoid static analysis issues - pg is server-only
let pool: any = null
let adapter: 'pg' | 'sqlite' | null = null

function ensureDir(dir: string) {
  const fs = require('fs')
  const path = require('path')
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch (e) {
    // ignore
  }
}

// Unified getDbPool that supports pg or SQLite (better-sqlite3) fallback
export function getDbPool() {
  if (pool) return pool

  // Try Postgres first
  try {
    const pg = require('pg')
    const PoolClass = pg.Pool
    // sanitize env values to prevent accidental concatenation like
    // DB_NAME=marketing_dbNODE_ENV=development (missing newline in .env)
    function sanitizeEnv(v: any) {
      if (!v) return v
      let s = String(v).trim()
      // if someone accidentally concatenated another env like NODE_ENV=..., strip it
      const nodeEnvIndex = s.indexOf('NODE_ENV=')
      if (nodeEnvIndex !== -1) s = s.slice(0, nodeEnvIndex)
      return s.trim()
    }

    const connectionString = sanitizeEnv(process.env.DATABASE_URL)

    if (!connectionString) {
      pool = new PoolClass({
        host: sanitizeEnv(process.env.DB_HOST) || 'localhost',
        port: parseInt(sanitizeEnv(process.env.DB_PORT) || '5432'),
        database: sanitizeEnv(process.env.DB_NAME) || 'marketing_db',
        user: sanitizeEnv(process.env.DB_USER) || 'postgres',
        password: sanitizeEnv(process.env.DB_PASSWORD) || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    } else {
      pool = new PoolClass({
        connectionString: connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    }
    adapter = 'pg'
    return pool
  } catch (pgErr: any) {
    // If pg is not available, fall back to SQLite
  }

  // SQLite fallback using better-sqlite3
  try {
    const BetterSqlite3 = require('better-sqlite3')
    const path = require('path')
    const dbDir = path.resolve(process.cwd(), 'data')
    ensureDir(dbDir)
    const dbFile = path.join(dbDir, 'dev.sqlite')
    const sqliteDb = new BetterSqlite3(dbFile)

    // Provide a pool-like API with async query(sql, params)
    pool = {
      async query(sql: string, params?: any[]) {
        try {
          // Normalize params
          params = params || []

          // Convert Postgres-style $1, $2 placeholders to SQLite `?` placeholders
          const sqliteSql = String(sql).replace(/\$\d+/g, '?')

          const stmt = sqliteDb.prepare(sqliteSql)
          // Decide between all and run: if SELECT use all()
          const normalized = sqliteSql.trim().toUpperCase()
          if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA') || normalized.startsWith('WITH')) {
            const rows = stmt.all(...params)
            return { rows }
          } else {
            const info = stmt.run(...params)
            return { rows: [], info }
          }
        } catch (err) {
          throw err
        }
      },
      // expose a close method for cleanup
      async end() {
        try {
          sqliteDb.close()
        } catch (e) {
          // ignore
        }
      }
    }
    adapter = 'sqlite'
    return pool
  } catch (sqliteErr: any) {
    console.error('No database driver available (pg or better-sqlite3).')
    throw new Error('No database driver available. Install `pg` or `better-sqlite3`.')
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDbPool()
    if (!db) return false

    if (adapter === 'pg') {
      const result = await db.query('SELECT NOW() as current_time, current_database() as database_name, current_user as user_name')
      console.log('Database (pg) connected successfully:', result.rows[0])
    } else if (adapter === 'sqlite') {
      const result = await db.query("SELECT datetime('now') as current_time")
      console.log('Database (sqlite) connected successfully:', result.rows[0])
    }
    return true
  } catch (error: any) {
    console.error('Database connection error:', error)
    return false
  }
}

// Close database connection
export async function closeConnection(): Promise<void> {
  if (!pool) return
  try {
    if (adapter === 'pg') {
      await pool.end()
    } else if (adapter === 'sqlite') {
      await pool.end()
    }
  } catch (e) {
    // ignore
  }
  pool = null
  adapter = null
}

