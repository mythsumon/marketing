# Database Connection Setup Guide

## Step 1: Install PostgreSQL Package

The `pg` package is required for database connectivity. Install it:

```powershell
npm install pg
```

If you have npm authentication issues, try:
```powershell
npm install pg --registry https://registry.npmjs.org/
```

Or use yarn:
```powershell
yarn add pg
```

## Step 2: Configure Environment Variables

Create or update `.env.local` file in the project root with your database credentials:

### Option 1: Using DATABASE_URL (Recommended)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/marketing_db
```

### Option 2: Using Individual Parameters
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_db
DB_USER=postgres
DB_PASSWORD=your_password
```

**Replace with your actual values:**
- `username` → Your PostgreSQL username (usually `postgres`)
- `password` → Your PostgreSQL password
- `localhost` → Your database host (if different)
- `5432` → Your PostgreSQL port (default is 5432)
- `marketing_db` → Your database name

## Step 3: Ensure PostgreSQL is Running

Make sure your PostgreSQL server is running and accessible.

Test connection from command line:
```powershell
psql -U postgres -h localhost -d marketing_db -c "SELECT 1;"
```

## Step 4: Create Database and Tables

If you haven't created the database yet:

1. Create the database:
```sql
CREATE DATABASE marketing_db;
```

2. Run the schema:
```powershell
psql -U postgres -d marketing_db -f database/schema.sql
```

## Step 5: Restart Next.js Server

After installing `pg` and configuring `.env.local`:

1. Stop the server (Ctrl+C)
2. Start it again: `npm run dev`

## Step 6: Test Connection

Visit: `http://localhost:3000/api/health/db`

This will show:
- ✅ If `pg` package is installed
- ✅ If environment variables are loaded
- ✅ If database connection is successful
- ❌ Detailed error messages if something is wrong

## Troubleshooting

### Error: "pg is not installed"
**Solution:** Run `npm install pg`

### Error: "Database connection failed"
**Check:**
1. Is PostgreSQL running?
2. Are credentials in `.env.local` correct?
3. Did you restart the server after creating `.env.local`?
4. Is the database `marketing_db` created?
5. Are the tables created? (run `database/schema.sql`)

### Error: "password authentication failed"
**Solution:** Check your PostgreSQL password in `.env.local`

### Error: "database does not exist"
**Solution:** Create the database: `CREATE DATABASE marketing_db;`

### Error: "relation does not exist"
**Solution:** Run the schema: `psql -U postgres -d marketing_db -f database/schema.sql`



