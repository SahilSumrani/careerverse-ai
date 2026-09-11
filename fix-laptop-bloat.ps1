# Run as Administrator: Right-click -> Run with PowerShell (Admin)
# Fixes background bloat: AnyDesk, Autodesk, Claude, HP services

Requires -RunAsAdministrator

$ErrorActionPreference = 'Continue'

Write-Host "=== Stopping and disabling bloat services ===" -ForegroundColor Cyan

$servicesToDisable = @(
    'AnyDesk',                      # Remote desktop - only needed when using AnyDesk
    'CoworkVMService',              # Claude Desktop VM service
    'Autodesk Access Service Host',
    'Autodesk CER Service',
    'AdskLicensingService',         # Only disable if you don't use AutoCAD/Revit regularly
    'HP Comm Recover',
    'HPAppPrintScanDoctorService',
    'HPPrintScanDoctorService',
    'hp-one-agent-service',
    'HpTouchpointAnalyticsService',
    'HPAppHelperCap',
    'HPDiagsCap',
    'HPNetworkCap',
    'HPSysInfoCap'
)

foreach ($svc in $servicesToDisable) {
    $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if (-not $s) {
        Write-Host "  SKIP: $svc (not installed)" -ForegroundColor Yellow
        continue
    }
    if ($s.Status -eq 'Running') {
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    }
  Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
    Write-Host "  Disabled: $svc" -ForegroundColor Green
}

Write-Host "`n=== Removing startup entries ===" -ForegroundColor Cyan

$runKeys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
)

$removeNames = @(
    'Autodesk Access',
    'Autodesk Access Service',
    'Flow Service',
    'AnyDesk',
    'HPSEU_Host_Launcher'
)

foreach ($key in $runKeys) {
    if (-not (Test-Path $key)) { continue }
    foreach ($name in $removeNames) {
        if (Get-ItemProperty $key -Name $name -ErrorAction SilentlyContinue) {
            Remove-ItemProperty -Path $key -Name $name -ErrorAction SilentlyContinue
            Write-Host "  Removed startup: $name" -ForegroundColor Green
        }
    }
}

Write-Host "`n=== Done! Restart laptop for full effect. ===" -ForegroundColor Cyan
Write-Host "Note: Re-enable AnyDesk service if you need remote access again." -ForegroundColor Yellow
Write-Host "Note: Re-enable AdskLicensingService if you use Autodesk apps." -ForegroundColor Yellow
