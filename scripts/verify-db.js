#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, { encoding: 'utf8' })
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    // remove surrounding quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

(async function main() {
  try {
    // load .env.local from project root
    const repoRoot = path.resolve(__dirname, '..')
    const envPath = path.join(repoRoot, '.env.local')
    loadEnvFile(envPath)

    // prefer DATABASE_URL
    const connectionString = process.env.DATABASE_URL

    let driver = 'pg'
    let connected = false

    try {
      const pg = require('pg')
      const { Pool } = pg
      const poolOptions = connectionString
        ? { connectionString }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'marketing_db',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
          }

      const pool = new Pool(poolOptions)
      console.log('Attempting Postgres connection...')
      const res = await pool.query('SELECT NOW() as now')
      console.log('Postgres connected — current time:', res.rows[0].now)
      await pool.end()
      connected = true
    } catch (pgErr) {
      // Try SQLite fallback
      try {
        const BetterSqlite3 = require('better-sqlite3')
        const path = require('path')
        const fs = require('fs')
        const dbDir = path.resolve(process.cwd(), 'data')
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
        const dbFile = path.join(dbDir, 'dev.sqlite')
        const sqliteDb = new BetterSqlite3(dbFile)
        console.log('Attempting SQLite connection (fallback)...')
        const stmt = sqliteDb.prepare("SELECT datetime('now') as now")
        const row = stmt.get()
        console.log('SQLite connected — current time:', row.now)
        sqliteDb.close()
        driver = 'sqlite'
        connected = true
      } catch (sqliteErr) {
        console.error('\nNo suitable DB driver found. Install `pg` or `better-sqlite3` and try again.')
        console.error('pg error:', pgErr && pgErr.message)
        console.error('sqlite error:', sqliteErr && sqliteErr.message)
        process.exitCode = 2
        return
      }
    }

    if (connected) {
      console.log(`Connection successful using ${driver}`)
      process.exitCode = 0
    }
  } catch (error) {
    console.error('Database connection failed:')
    console.error(error && error.stack ? error.stack : error)
    process.exitCode = 1
  }
})()
