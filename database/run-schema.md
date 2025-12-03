# How to Run the Schema

Since you've already created the `marketing_db` database, you need to run the schema to create all tables.

## Option 1: Using pgAdmin (GUI)

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Expand Databases → marketing_db
4. Right-click on marketing_db → Query Tool
5. Open `database/schema.sql` file
6. Click Execute (F5) or press F5

## Option 2: Using PowerShell Script (Easiest)

Run the automated script that will find PostgreSQL and run the schema:
```powershell
.\database\run-schema.ps1
```

This script will:
- Automatically find your PostgreSQL installation
- Prompt for your PostgreSQL password
- Run the schema file

## Option 3: Using psql (Command Line)

If PostgreSQL bin directory is in your PATH:
```bash
psql -U postgres -d marketing_db -f database/schema.sql
```

If not, use full path:
```bash
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d marketing_db -f database/schema.sql
```

(Replace `15` with your PostgreSQL version number)

## Option 4: Copy and Paste

1. Open `database/schema.sql` in a text editor
2. Copy all the SQL code
3. Open pgAdmin Query Tool for marketing_db
4. Paste and execute

## Verify Tables Were Created

After running the schema, verify with:
```sql
\dt
```

Or in pgAdmin, you should see these tables:
- users
- regions
- hotels
- notes
- activity_logs

