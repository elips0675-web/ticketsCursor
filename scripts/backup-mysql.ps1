param(
  [string]$outputDir = ".\backups",
  [int]$retentionDays = 7
)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$db = $env:DB_NAME -or "servicedesk"
$user = $env:DB_USER -or "root"
$pass = $env:DB_PASSWORD
$file = "$outputDir\${db}_$timestamp.sql"
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }
if ($pass) { mysqldump -u $user -p$pass $db | Out-File $file -Encoding utf8 }
else { mysqldump -u $user $db | Out-File $file -Encoding utf8 }
Write-Host "Backup: $file"
Get-ChildItem $outputDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) } | Remove-Item -Force
