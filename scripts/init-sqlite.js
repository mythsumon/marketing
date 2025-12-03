#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

async function main() {
  try {
    const BetterSqlite3 = require('better-sqlite3')
    const repoRoot = path.resolve(__dirname, '..')
    const dbDir = path.join(repoRoot, 'data')
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
    const dbFile = path.join(dbDir, 'dev.sqlite')

    const schemaPath = path.join(repoRoot, 'database', 'schema.sql')
    if (!fs.existsSync(schemaPath)) {
      console.error('schema.sql not found at', schemaPath)
      process.exitCode = 2
      return
    }

    const sql = fs.readFileSync(schemaPath, 'utf8')

    const db = new BetterSqlite3(dbFile)
    // Split statements naively on semicolon — schema.sql should be well-formed
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean)

    console.log(`Applying ${statements.length} statements to ${dbFile} ...`)
    const exec = db.transaction((stmts) => {
      for (const stmt of stmts) {
        db.prepare(stmt).run()
      }
    })

    exec(statements)
    db.close()
    console.log('SQLite schema applied successfully.')
  } catch (err) {
    console.error('Failed to initialize SQLite schema:', err && err.message)
    process.exitCode = 1
  }
}

main()
