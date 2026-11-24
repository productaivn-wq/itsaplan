<#
.SYNOPSIS
  1-Command Zero-Bun / Zero-Node Docker Launcher for ItsAPlan (Windows).
#>
[CmdletBinding()]
param(
    [switch]$Check,
    [switch]$DryRun,
    [switch]$Pull
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

if ($Check -or $DryRun) {
    Write-Host "[CHECK] ItsAPlan Zero-Bun Docker Launcher (Windows)"
    Write-Host "[CHECK] Repo root: $RepoRoot"
    Write-Host "[CHECK] Actions  : verify docker -> auto-generate .env secrets if missing -> docker compose up -d"
    exit 0
}

try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw "docker info failed" }
} catch {
    Write-Error "Docker is not running. Start Docker Desktop and re-run '.\start.ps1'."
    exit 1
}

function New-RandomHex {
    param([int]$Bytes = 24)
    $buf = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
    return ([System.BitConverter]::ToString($buf) -replace "-", "").ToLowerInvariant()
}

$EnvPath = Join-Path $RepoRoot ".env"
if (-not (Test-Path $EnvPath)) {
    Write-Host "[1/3] Generating .env with fresh local secrets (zero Bun/Node required)..."
    $PgPw = New-RandomHex
    $AuthSec = New-RandomHex
    $EncKey = New-RandomHex
    $S3Key = "rustfs" + (New-RandomHex 6)
    $S3Sec = New-RandomHex
    $Lines = Get-Content (Join-Path $RepoRoot ".env.example") | ForEach-Object {
        if ($_ -match "^POSTGRES_PASSWORD=") { "POSTGRES_PASSWORD=$PgPw" }
        elseif ($_ -match "^DATABASE_URL=") { "DATABASE_URL=postgres://itsaplan:${PgPw}@localhost:5432/itsaplan" }
        elseif ($_ -match "^BETTER_AUTH_SECRET=") { "BETTER_AUTH_SECRET=$AuthSec" }
        elseif ($_ -match "^APP_ENCRYPTION_KEY=") { "APP_ENCRYPTION_KEY=$EncKey" }
        elseif ($_ -match "^S3_ACCESS_KEY_ID=") { "S3_ACCESS_KEY_ID=$S3Key" }
        elseif ($_ -match "^S3_SECRET_ACCESS_KEY=") { "S3_SECRET_ACCESS_KEY=$S3Sec" }
        else { $_ }
    }
    Set-Content -Path $EnvPath -Value $Lines -Encoding UTF8
} else {
    Write-Host "[1/3] Using existing .env"
}

if ($Pull) {
    Write-Host "[2/3] Pulling images and starting Docker stack..."
    docker compose pull
    docker compose up -d
} else {
    Write-Host "[2/3] Building and starting Docker stack..."
    docker compose up -d --build
}

Write-Host "[3/3] Waiting for ItsAPlan Web UI at http://localhost:3001 ..."
for ($i = 0; $i -lt 45; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3001" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -lt 400) {
            Write-Host "[OK] ItsAPlan is ready at http://localhost:3001"
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 2
}
Write-Host "[WARN] Stack started; open http://localhost:3001 once containers finish warming up."
