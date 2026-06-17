# Respaldo de datos locales Las Marías Experience (JSON + uploads + licenses)
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $repoRoot "apps\api\data\experience-applications"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destDir = Join-Path $repoRoot "backups\experience-applications-$timestamp"

if (-not (Test-Path $sourceDir)) {
  Write-Error "No existe el directorio de datos: $sourceDir"
}

New-Item -ItemType Directory -Path $destDir -Force | Out-Null

$items = @(
  "applications.json",
  "uploads",
  "licenses"
)

foreach ($item in $items) {
  $src = Join-Path $sourceDir $item
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination (Join-Path $destDir $item) -Recurse -Force
    Write-Host "Copiado: $item"
  } else {
    Write-Host "Omitido (no existe): $item"
  }
}

Write-Host ""
Write-Host "Respaldo completado en: $destDir"
