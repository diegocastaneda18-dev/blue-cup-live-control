# Las Marías Experience — local dev (web + API + Postgres)
# Usage: pnpm experience:dev
#        or:  pwsh ./scripts/dev-experience.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "=== Las Marias Experience — dev local ===" -ForegroundColor Cyan
Write-Host ""

# 1. Env checks
$webEnv = Join-Path $Root "apps\web\.env.local"
if (-not (Test-Path $webEnv)) {
  Write-Host "[!] Falta apps/web/.env.local" -ForegroundColor Yellow
  Write-Host "    Copia apps/web/.env.example -> apps/web/.env.local" -ForegroundColor Yellow
  Write-Host "    y define NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" -ForegroundColor Yellow
  exit 1
}

$apiEnv = Join-Path $Root "apps\api\.env"
if (-not (Test-Path $apiEnv)) {
  Write-Host "[!] Falta apps/api/.env (DATABASE_URL para Postgres)" -ForegroundColor Yellow
  exit 1
}

# 2. Postgres via Docker
Write-Host "[1/3] Levantando Postgres (Docker)..." -ForegroundColor Green
docker compose -f infra/docker/docker-compose.yml up -d
if ($LASTEXITCODE -ne 0) {
  Write-Host "[X] Docker no pudo iniciar Postgres. Abre Docker Desktop e intenta de nuevo." -ForegroundColor Red
  exit 1
}

Start-Sleep -Seconds 2

# 3. Start web + API in one Turbo process (do not Ctrl+C unless you want to stop both)
Write-Host "[2/3] Iniciando API (:4000) + Web (:3003)..." -ForegroundColor Green
Write-Host ""
Write-Host "  Sitio:    http://localhost:3003" -ForegroundColor White
Write-Host "  Wizard:   http://localhost:3003/#reservar" -ForegroundColor White
Write-Host "  API:      http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "  Espera 'Ready' (web) y 'listening on port 4000' (api) antes de abrir el navegador." -ForegroundColor DarkGray
Write-Host "  No cierres esta terminal — Ctrl+C detiene web y API." -ForegroundColor DarkGray
Write-Host ""

pnpm exec turbo dev --filter=@bluecup/web --filter=@bluecup/api
