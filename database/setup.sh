#!/bin/bash
# PostgreSQL Database Setup Script

echo "Creating database marketing_db..."
psql -U postgres -c "CREATE DATABASE marketing_db;"

echo "Creating schema..."
psql -U postgres -d marketing_db -f database/schema.sql

echo "Database setup complete!"
echo "You can now connect to: postgresql://localhost:5432/marketing_db"




