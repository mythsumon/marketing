# PostgreSQL Database Setup Script for Windows PowerShell

Write-Host "Creating database marketing_db..." -ForegroundColor Green
psql -U postgres -c "CREATE DATABASE marketing_db;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Creating schema..." -ForegroundColor Green
    psql -U postgres -d marketing_db -f database/schema.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database setup complete!" -ForegroundColor Green
        Write-Host "Connection string: postgresql://localhost:5432/marketing_db" -ForegroundColor Cyan
    } else {
        Write-Host "Error creating schema" -ForegroundColor Red
    }
} else {
    Write-Host "Error creating database. It may already exist." -ForegroundColor Yellow
    Write-Host "Trying to create schema anyway..." -ForegroundColor Yellow
    psql -U postgres -d marketing_db -f database/schema.sql
}




