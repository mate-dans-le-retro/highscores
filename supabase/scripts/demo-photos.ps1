<#
.SYNOPSIS
  Uploads the demo photos to photos/demo/ in the Supabase Storage of the
  linked project, or removes them with -Remove.

.DESCRIPTION
  The SVG files of demo-photos/ are placeholders drawn for this repository
  (no third-party image, no real person). demo-seed.sql links a demo score to
  photos/demo/<name>.svg only when the file is already in the bucket: upload
  first, then run (or run again) demo-seed.sql.

  Only the files of demo-photos/, under photos/demo/, are written or removed,
  each by its own path: players upload to photos/submissions/ and volunteers
  to photos/admin/.

  Uses the Supabase CLI of the repository (pnpm exec supabase), logged in
  (pnpm exec supabase login) and linked to the project (pnpm exec supabase
  link), or given -ProjectRef.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File supabase/scripts/demo-photos.ps1 -DryRun
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File supabase/scripts/demo-photos.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File supabase/scripts/demo-photos.ps1 -Remove
#>
param(
  # Removes photos/demo/ instead of uploading.
  [switch]$Remove,
  # Project ref (the subdomain of the Supabase URL); the linked project otherwise.
  [string]$ProjectRef,
  # Prints the CLI commands without running them.
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$remote = if ($ProjectRef) { "--remote=$ProjectRef" } else { '--remote' }
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$photos = Get-ChildItem (Join-Path $PSScriptRoot 'demo-photos') -Filter '*.svg' | Sort-Object Name
$targets = $photos | ForEach-Object { "ss:///photos/demo/$($_.Name)" }

# Storage commands are experimental in the Supabase CLI 3.
function Invoke-Cli([string[]]$CliArgs, [switch]$AllowFailure) {
  $CliArgs += @($remote, '--experimental', '--yes')
  Write-Host "supabase $($CliArgs -join ' ')"
  if ($DryRun) { return }
  & pnpm exec supabase @CliArgs
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
    throw "The Supabase CLI failed (exit code $LASTEXITCODE)."
  }
}

Push-Location $repoRoot
try {
  if ($Remove) {
    Invoke-Cli (@('storage', 'rm') + $targets)
    Write-Host "$($photos.Count) demo photos removed from photos/demo/."
    return
  }

  # The upload does not overwrite: removing first lets a second run replace
  # the files. Nothing to remove the first time, so a failure is fine here.
  Invoke-Cli (@('storage', 'rm') + $targets) -AllowFailure
  foreach ($photo in $photos) {
    Invoke-Cli @(
      'storage', 'cp', $photo.FullName, "ss:///photos/demo/$($photo.Name)",
      '--content-type', 'image/svg+xml'
    )
  }
  Write-Host "$($photos.Count) photos in photos/demo/. Run demo-seed.sql (again) to link them."
}
finally {
  Pop-Location
}
