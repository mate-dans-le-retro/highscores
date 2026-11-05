<#
.SYNOPSIS
  Uploads the demo photos to photos/demo/ in the Supabase Storage of the
  linked project, or removes them with -Remove.

.DESCRIPTION
  The SVG files of photos/demo/ in this folder are placeholders drawn for this
  repository (no third-party image, no real person). Their folder mirrors
  their path in the bucket. demo-seed.sql links a demo score to
  photos/demo/<name>.svg only when the file is already in the bucket: upload
  first, then run (or run again) demo-seed.sql.

  Upload: one recursive copy of the local folder named demo into the root of
  the photos bucket, so the files land in photos/demo/ and replace the ones
  already there (the CLI only overwrites in recursive mode). Removal: each
  file by its own path, never a whole folder. Players upload to
  photos/submissions/ and volunteers to photos/admin/.

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
  # Removes the demo photos instead of uploading them.
  [switch]$Remove,
  # Project ref (the subdomain of the Supabase URL); the linked project otherwise.
  [string]$ProjectRef,
  # Prints the CLI commands without running them.
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$remote = if ($ProjectRef) { "--remote=$ProjectRef" } else { '--remote' }
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
# The CLI reads a local path like a URL: a Windows drive (D:\) parses as a
# scheme and the copy fails with "Unsupported operation". Hence a path
# relative to the repository root, with forward slashes.
$localFolder = 'supabase/scripts/photos/demo'
$photos = Get-ChildItem (Join-Path $repoRoot $localFolder) -File | Sort-Object Name
if ($photos | Where-Object Extension -ne '.svg') {
  throw "$localFolder must only hold the demo SVG files: all of it is uploaded."
}

# Storage commands are experimental in the Supabase CLI 3.
function Invoke-Cli([string[]]$CliArgs) {
  $CliArgs += @($remote, '--experimental', '--yes')
  Write-Host "supabase $($CliArgs -join ' ')"
  if ($DryRun) { return }
  & pnpm exec supabase @CliArgs
  if ($LASTEXITCODE -ne 0) {
    throw "The Supabase CLI failed (exit code $LASTEXITCODE)."
  }
}

Push-Location $repoRoot
try {
  if ($Remove) {
    Invoke-Cli (@('storage', 'rm') + ($photos | ForEach-Object { "ss:///photos/demo/$($_.Name)" }))
    Write-Host "$($photos.Count) demo photos removed from photos/demo/."
    return
  }

  # The local folder is named demo and the destination is the bucket root,
  # which always exists: the files land in photos/demo/, whatever is there.
  Invoke-Cli @(
    'storage', 'cp', '--recursive', $localFolder, 'ss:///photos/',
    '--content-type', 'image/svg+xml', '--jobs', '4'
  )
  Write-Host "$($photos.Count) photos in photos/demo/. Run demo-seed.sql (again) to link them."
}
finally {
  Pop-Location
}
