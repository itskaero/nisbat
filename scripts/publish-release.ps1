# Publish Nisbat Home to GitHub: push the branch, create the release with the
# signed APK, and deploy the website (site/) to GitHub Pages (gh-pages branch).
#
#   powershell -ExecutionPolicy Bypass -File scripts\publish-release.ps1
#
# Needs a GitHub token with "repo" scope (classic) or Contents + Pages
# read/write (fine-grained) for itskaero/nisbat. It is asked for at the prompt,
# used for this run only, and never written to disk.
param(
  [string]$Repo = "itskaero/nisbat",
  [string]$Branch = "nisbat-home",
  [string]$Tag = "v1.0.0",
  [string]$Apk = "apps/mobile/release/nisbat.apk"
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$git = @("-c", "safe.directory=*")

if (-not (Test-Path $Apk)) { throw "APK not found at $Apk. Build it first (see apps/mobile/README.md)." }
$token = $env:GITHUB_TOKEN
if (-not $token) {
  $sec = Read-Host "GitHub token for $Repo" -AsSecureString
  $token = [Runtime.InteropServices.Marshal]::PtrToStringAuth([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}
$h = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json"; "X-GitHub-Api-Version" = "2022-11-28" }
$remote = "https://x-access-token:$token@github.com/$Repo.git"

Write-Host "1/4 Pushing $Branch"
git @git push $remote "${Branch}:${Branch}"
if ($LASTEXITCODE) { throw "git push failed" }

Write-Host "2/4 Creating release $Tag"
$sha = (Get-FileHash $Apk -Algorithm SHA256).Hash.ToLower()
$size = [math]::Round((Get-Item $Apk).Length / 1MB, 1)
$notes = Get-Content "apps/mobile/RELEASE_NOTES.md" -Raw
$notes = $notes.Replace("{{SHA256}}", $sha).Replace("{{SIZE}}", "$size MB")
$existing = $null
try { $existing = Invoke-RestMethod -Headers $h "https://api.github.com/repos/$Repo/releases/tags/$Tag" } catch {}
if ($existing) { Invoke-RestMethod -Method Delete -Headers $h "https://api.github.com/repos/$Repo/releases/$($existing.id)" | Out-Null }
$body = @{ tag_name = $Tag; target_commitish = $Branch; name = "Nisbat $($Tag.TrimStart('v'))"; body = $notes; make_latest = "true" } | ConvertTo-Json
$rel = Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" -Body $body "https://api.github.com/repos/$Repo/releases"
$upload = $rel.upload_url -replace "\{.*\}", ""
Invoke-RestMethod -Method Post -Headers $h -ContentType "application/vnd.android.package-archive" -InFile $Apk "${upload}?name=nisbat.apk" | Out-Null
Write-Host "   $($rel.html_url)"

Write-Host "3/4 Deploying site/ to gh-pages"
$tmp = Join-Path $env:TEMP "nisbat-pages"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory $tmp | Out-Null
Copy-Item -Recurse "site/*" $tmp
Copy-Item "site/.nojekyll" $tmp -ErrorAction SilentlyContinue
Push-Location $tmp
git init -q -b gh-pages
git add -A
git -c user.name="Nisbat release" -c user.email="noreply@github.com" commit -q -m "Nisbat Home site ($Tag)"
git push -f $remote gh-pages
if ($LASTEXITCODE) { Pop-Location; throw "Pushing gh-pages failed" }
Pop-Location

Write-Host "4/4 Turning on GitHub Pages"
$pages = @{ source = @{ branch = "gh-pages"; path = "/" } } | ConvertTo-Json
try { Invoke-RestMethod -Method Post -Headers $h -ContentType "application/json" -Body $pages "https://api.github.com/repos/$Repo/pages" | Out-Null }
catch { Invoke-RestMethod -Method Put -Headers $h -ContentType "application/json" -Body $pages "https://api.github.com/repos/$Repo/pages" | Out-Null }
$owner, $name = $Repo.Split("/")
Write-Host "Done. Site: https://$owner.github.io/$name/  (first build takes a minute)"
Write-Host "APK: https://github.com/$Repo/releases/latest/download/nisbat.apk"
