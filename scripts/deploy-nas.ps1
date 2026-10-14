# Deploy Nisbat Home to a NAS / home server over SSH and start it with Docker Compose.
#
#   powershell -ExecutionPolicy Bypass -File scripts\deploy-nas.ps1
#
# Copies the source (not node_modules/.next/data), keeps the NAS's existing
# .env and data folder, and rebuilds the containers on the NAS.
param(
  [string]$NasHost = "192.168.1.42",
  [string]$User = "root",
  [string]$Key = "$env:USERPROFILE\.ssh\nisbat_nas_ed25519",
  [string]$RemoteDir = "/DATA/AppData/nisbat",
  [int]$Port = 3080,
  [string]$CastDevice = "Dining Room TV",
  [string]$CastHost = "192.168.1.44"
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$ssh = @("-i", $Key, "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "$User@$NasHost")
$bundle = Join-Path $env:TEMP "nisbat-deploy.tar.gz"

Write-Host "1/4 Packing source from $root"
# An explicit list: Windows tar's --exclude=data would also drop src/data.
$items = @("src", "apps", "public", "scripts", "docker", "package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs",
  "tsconfig.json", "eslint.config.mjs", "next-env.d.ts", "Dockerfile", "docker-compose.yml", ".dockerignore", ".env.example", "README.md") |
  Where-Object { Test-Path (Join-Path $root $_) }
tar -czf $bundle -C $root @items
if ($LASTEXITCODE) { throw "tar failed" }

Write-Host "2/4 Copying to ${NasHost}:$RemoteDir"
ssh @ssh "mkdir -p '$RemoteDir'"
if ($LASTEXITCODE) { throw "SSH to $NasHost failed (is the key installed?)" }
scp -i $Key -o BatchMode=yes $bundle "${User}@${NasHost}:/tmp/nisbat-deploy.tar.gz"
if ($LASTEXITCODE) { throw "scp failed" }

Write-Host "3/4 Unpacking and writing .env (kept if it already exists)"
$envFile = @"
NISBAT_PORT=$Port
CAST_DEVICE=$CastDevice
CAST_HOST=$CastHost
NISBAT_URL=http://${NasHost}:$Port
TZ=Asia/Karachi
"@
$remote = @"
set -e
cd '$RemoteDir'
tar -xzf /tmp/nisbat-deploy.tar.gz && rm -f /tmp/nisbat-deploy.tar.gz
[ -f .env ] || cat > .env <<'ENVEOF'
$envFile
ENVEOF
mkdir -p data
"@
($remote -replace "`r", "") | ssh @ssh "sh -s"
if ($LASTEXITCODE) { throw "Unpacking on the NAS failed" }

Write-Host "4/4 Building and starting containers (first build takes a few minutes)"
ssh @ssh "cd '$RemoteDir' && docker compose up -d --build && docker compose ps"
if ($LASTEXITCODE) { throw "docker compose failed" }
Write-Host "Done: http://${NasHost}:$Port  (remote: http://${NasHost}:$Port/remote)"
