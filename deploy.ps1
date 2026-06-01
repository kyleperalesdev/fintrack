$projectDir = "<fintrack-path>\fintrack"
$staging = "$env:TEMP\fintrack-deploy"
$server = "<user>@192.168.x.xx"

# Backup the server database to local machine before deploying
Write-Host "Backing up server database..."
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "$projectDir\backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
scp $server`:/opt/fintrack-backups/fintrack-$(Get-Date -Format "yyyyMMdd").db "$backupDir\fintrack-$timestamp.db" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup saved to backups\fintrack-$timestamp.db"
} else {
    Write-Host "No existing backup found on server yet, skipping."
}

# Stage a clean copy excluding node_modules, .git, db files, and backups
Write-Host "Staging files..."
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
robocopy $projectDir $staging /E /XD node_modules .git backups /XF *.db /NFL /NDL /NJH /NJS | Out-Null

# Copy staged files to server
Write-Host "Copying files to server..."
scp -r "$staging\." $server`:/opt/fintrack

# Clean up staging directory
Remove-Item -Recurse -Force $staging

# Rebuild and restart containers
Write-Host "Rebuilding containers..."
ssh $server "cd /opt/fintrack && docker compose up -d --build"

Write-Host "Deploy complete. App available at http://100.x.x.x:8080"
