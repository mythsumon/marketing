# Database Setup - PostgreSQL

## Quick Start

### Step 1: Create the Database
```bash
psql -U postgres -f database/init.sql
```

Or connect to PostgreSQL and run:
```sql
CREATE DATABASE marketing_db;
```

### Step 2: Create Tables and Schema
```bash
psql -U postgres -d marketing_db -f database/schema.sql
```

### Alternative: Run both in one command
```bash
psql -U postgres << EOF
CREATE DATABASE marketing_db;
\c marketing_db
\i database/schema.sql
EOF
```

## Database Structure

- **users**: System users (admins and callers)
- **regions**: Available regions for hotels
- **hotels**: Hotel records with status and assignment
- **notes**: Notes attached to hotels
- **activity_logs**: Audit trail of hotel status changes

## Connection String Examples

### MySQL
```
mysql://user:password@localhost:3306/marketing_db
```

### PostgreSQL
```
postgresql://user:password@localhost:5432/marketing_db
```

