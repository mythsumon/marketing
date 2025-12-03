# PowerShell script to run PostgreSQL schema
# This script will find PostgreSQL installation and run the schema

Write-Host "Looking for PostgreSQL installation..." -ForegroundColor Cyan

# Common PostgreSQL installation paths
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files\PostgreSQL\12\bin\psql.exe",
    "$env:ProgramFiles\PostgreSQL\*\bin\psql.exe"
)

$psqlPath = $null

# Try to find psql.exe
foreach ($path in $possiblePaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        $psqlPath = $resolved[0].Path
        break
    }
}

# Also check if psql is in PATH
if (-not $psqlPath) {
    $psqlInPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlInPath) {
        $psqlPath = $psqlInPath.Source
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: Could not find psql.exe" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use pgAdmin to run database/schema.sql manually" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green
Write-Host ""
Write-Host "Running schema..." -ForegroundColor Cyan

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$schemaFile = Join-Path $scriptDir "schema.sql"

# Prompt for password
$securePassword = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $password

try {
    # Run the schema
    & $psqlPath -U postgres -d marketing_db -f $schemaFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Schema executed successfully!" -ForegroundColor Green
        Write-Host "All tables, indexes, and triggers have been created." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Error running schema. Check the error messages above." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

