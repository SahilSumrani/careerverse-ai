# Uninstall all Autodesk software (Maya 2027 + components)
# Run as Administrator

$ErrorActionPreference = 'Continue'

function Uninstall-Msi {
    param([string]$Name, [string]$Guid)
    Write-Host "[MSI] Uninstalling: $Name" -ForegroundColor Cyan
    $p = Start-Process msiexec.exe -ArgumentList "/x $Guid /qn /norestart" -PassThru -Wait -NoNewWindow
    if ($p.ExitCode -eq 0 -or $p.ExitCode -eq 3010) {
        Write-Host "  OK: $Name" -ForegroundColor Green
    } else {
        Write-Host "  WARN: $Name exit code $($p.ExitCode)" -ForegroundColor Yellow
    }
}

function Uninstall-Odis {
    param([string]$Name, [string]$Args)
    Write-Host "[ODIS] Uninstalling: $Name" -ForegroundColor Cyan
    $p = Start-Process "C:\Program Files\Autodesk\AdODIS\V1\Installer.exe" -ArgumentList $Args -PassThru -Wait -NoNewWindow
    Write-Host "  Done: $Name (exit $($p.ExitCode))" -ForegroundColor Green
}

Write-Host "=== Removing Maya extensions first ===" -ForegroundColor White

Uninstall-Msi "Flow Retopology" "{00465FD6-8515-46F6-B7DF-FEE92AAC3EE0}"
Uninstall-Msi "MayaUSD Extension" "{89A4374C-20BE-499C-B350-7114A29DF6A7}"
Uninstall-Msi "Bifrost" "{8BBAA910-AF64-4907-B1DC-41AB1BA514A7}"
Uninstall-Msi "LookdevX" "{BB9F200A-49A6-47D3-8697-6DB52B42B17B}"
Uninstall-Msi "MtoA Arnold" "{DE48BF2C-32F7-44AA-8F27-61E7DCE1C51D}"
Uninstall-Msi "MayaFlow" "{ECD3869A-0250-4635-8D97-39EAC6DA0EE1}"

if (Test-Path "C:\Program Files\Autodesk\AdODIS\V1\Installer.exe") {
    Uninstall-Odis "Maya 2027.1 Update" @(
        '-i','uninstall','--trigger_point','system',
        '-m','C:\ProgramData\Autodesk\ODIS\metadata\{30F3BDD4-08C5-3B6D-99FA-004DDAB0465A}\bundleManifest.xml',
        '-x','C:\ProgramData\Autodesk\ODIS\metadata\{30F3BDD4-08C5-3B6D-99FA-004DDAB0465A}\SetupRes\manifest.xsd'
    )
}

Uninstall-Msi "Autodesk Maya 2027" "{4763C2BB-1C85-4951-A898-337AB2C6A486}"
Uninstall-Msi "Autodesk Flow" "{5A9CA8EB-DEF2-4F68-B86F-851B2691DF34}"

if (Test-Path "C:\Program Files\Autodesk\AdODIS\V1\Installer.exe") {
    Uninstall-Odis "Autodesk Access" @(
        '-i','uninstall','--trigger_point','system',
        '-m','C:\ProgramData\Autodesk\ODIS\metadata\{A3158B3E-5F28-358A-BF1A-9532D8EBC811}\pkg.access.xml',
        '-x','C:\Program Files\Autodesk\AdODIS\V1\SetupRes\manifest.xsd',
        '--manifest_type','package'
    )
}

Uninstall-Msi "Autodesk Genuine Service" "{83170d71-4e9d-459f-be9a-e12c6db2af55}"
Uninstall-Msi "Autodesk CER" "{201AE4F3-3848-421F-A609-0A72B8FE631B}"

$identityUninstall = "C:\Program Files\Autodesk\AdskIdentityManager\uninstall.exe"
if (Test-Path $identityUninstall) {
    Write-Host "[EXE] Uninstalling Identity Manager" -ForegroundColor Cyan
    Start-Process $identityUninstall -ArgumentList '/S' -Wait -NoNewWindow
}

# Adobe Substance for Maya (optional Maya plugin)
$substance = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -match 'Substance.*Maya' }
if ($substance -and $substance.UninstallString) {
    Write-Host "[EXE] Uninstalling $($substance.DisplayName)" -ForegroundColor Cyan
    $exe = $substance.UninstallString -replace '"',''
    if ($exe -match '^(.+\.exe)') { Start-Process $matches[1] -ArgumentList '/SILENT' -Wait -NoNewWindow }
}

Write-Host "`n=== Autodesk uninstall complete. Restart recommended. ===" -ForegroundColor Green
