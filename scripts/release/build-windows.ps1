$ErrorActionPreference = "Stop"

function Write-BuildLog {
    param([string]$Message)
    Write-Host "[build] $Message"
}

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path

$AdbPath = Join-Path $RootDir "bin/windows/adb.exe"
$FastbootPath = Join-Path $RootDir "bin/windows/fastboot.exe"
$AdbWinApiPath = Join-Path $RootDir "bin/windows/AdbWinApi.dll"
$AdbWinUsbApiPath = Join-Path $RootDir "bin/windows/AdbWinUsbApi.dll"

if (-not (Test-Path $AdbPath)) {
    throw "Required file not found: $AdbPath"
}

if (-not (Test-Path $FastbootPath)) {
    throw "Required file not found: $FastbootPath"
}

if (-not (Test-Path $AdbWinApiPath)) {
    throw "Required file not found: $AdbWinApiPath"
}

if (-not (Test-Path $AdbWinUsbApiPath)) {
    throw "Required file not found: $AdbWinUsbApiPath"
}

$WailsJsonPath = Join-Path $RootDir "wails.json"
$WailsConfig = Get-Content -Raw $WailsJsonPath | ConvertFrom-Json
$Version = if ($env:ADBKIT_VERSION) { $env:ADBKIT_VERSION } else { $WailsConfig.info.productVersion }

Write-BuildLog "Windows builder ready for version $Version"

Write-BuildLog "Installing frontend dependencies"
pnpm install --frozen-lockfile --dir "$RootDir/frontend"

Write-BuildLog "Building frontend assets"
pnpm --dir "$RootDir/frontend" build

Write-BuildLog "Building NSIS installer"
Push-Location $RootDir
wails build -clean -upx -nsis
Pop-Location

$Installer = Get-ChildItem -Path (Join-Path $RootDir "build/bin") -Filter "*-installer.exe" | Select-Object -First 1
if (-not $Installer) {
    throw "NSIS installer was not generated"
}

$StandaloneZip = Join-Path $RootDir "build/ADBKit-windows-standalone.zip"
if (Test-Path $StandaloneZip) {
    Remove-Item $StandaloneZip -Force
}

Write-BuildLog "Creating standalone zip bundle"
Compress-Archive -Path "$RootDir/build/bin/*" -DestinationPath $StandaloneZip -CompressionLevel Optimal

Write-BuildLog "Windows packaging complete"
