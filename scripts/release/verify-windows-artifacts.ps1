$ErrorActionPreference = "Stop"

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Get-ZipEntries {
    param([string]$ZipPath)

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        return $zip.Entries | ForEach-Object { $_.FullName }
    }
    finally {
        $zip.Dispose()
    }
}

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$Installer = Get-ChildItem -Path (Join-Path $RootDir "build/bin") -Filter "*-installer.exe" | Select-Object -First 1
$StandaloneZip = Join-Path $RootDir "build/ADBKit-windows-standalone.zip"

Assert-True ($null -ne $Installer) "Installer artifact not found"
Assert-True (Test-Path $StandaloneZip) "Standalone zip artifact not found"

$entries = Get-ZipEntries -ZipPath $StandaloneZip

Assert-True ($entries -contains "bin/windows/adb.exe") "Standalone zip is missing bin/windows/adb.exe"
Assert-True ($entries -contains "bin/windows/fastboot.exe") "Standalone zip is missing bin/windows/fastboot.exe"
Assert-True ($entries -contains "bin/windows/AdbWinApi.dll") "Standalone zip is missing bin/windows/AdbWinApi.dll"
Assert-True ($entries -contains "bin/windows/AdbWinUsbApi.dll") "Standalone zip is missing bin/windows/AdbWinUsbApi.dll"

Write-Host "[build] Windows artifact verification passed"
