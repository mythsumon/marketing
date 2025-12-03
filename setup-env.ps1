# Setup Environment File Script

if (-not (Test-Path .env.local)) {
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Green
    
    # Read .env.example
    $envExample = Get-Content .env.example -Raw
    
    # Replace placeholder values
    $envContent = $envExample -replace 'username', 'postgres' -replace 'your_password', 'postgres'
    
    # Write .env.local
    Set-Content -Path .env.local -Value $envContent
    
    Write-Host ".env.local created successfully!" -ForegroundColor Green
    Write-Host "Please edit .env.local with your actual PostgreSQL credentials." -ForegroundColor Yellow
} else {
    Write-Host ".env.local already exists. Skipping creation." -ForegroundColor Yellow
}




