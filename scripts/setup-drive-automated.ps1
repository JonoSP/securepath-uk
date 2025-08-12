# Automated Google Drive Setup via CLI
# This uses Google's service account for automation

function Create-GoogleDriveStructure {
    $folders = @{
        "01_Clients" = @("Active_Clients", "Prospects", "Completed_Projects", "Templates")
        "02_Operations" = @("Policies_Procedures", "Security_Documentation", "ISO_27001_Framework", "Compliance_Evidence")
        "03_Finance" = @("Invoices", "Contracts", "Financial_Reports", "Budgets")
        "04_Marketing" = @("Content", "Campaigns", "Brand_Assets", "Case_Studies")
        "05_Internal" = @("Team_Resources", "Training_Materials", "Meeting_Notes", "Project_Management")
        "06_Technical" = @("Architecture_Docs", "API_Documentation", "Security_Configs", "Automation_Scripts")
    }

    # Use rclone for Google Drive automation
    Write-Host "Setting up rclone for Google Drive automation..." -ForegroundColor Green
    
    # Download rclone if not present
    if (!(Test-Path "C:\SecurePathUK\tools\rclone.exe")) {
        Write-Host "Downloading rclone..." -ForegroundColor Yellow
        $rcloneUrl = "https://downloads.rclone.org/v1.64.0/rclone-v1.64.0-windows-amd64.zip"
        $zipPath = "C:\SecurePathUK\tools\rclone.zip"
        
        New-Item -ItemType Directory -Path "C:\SecurePathUK\tools" -Force | Out-Null
        Invoke-WebRequest -Uri $rcloneUrl -OutFile $zipPath
        Expand-Archive -Path $zipPath -DestinationPath "C:\SecurePathUK\tools" -Force
        Move-Item "C:\SecurePathUK\tools\rclone-*\rclone.exe" "C:\SecurePathUK\tools\" -Force
        Remove-Item $zipPath
        Remove-Item "C:\SecurePathUK\tools\rclone-*" -Recurse -Force
    }

    # Configure rclone for Google Drive
    Write-Host "Configuring rclone for Google Drive..." -ForegroundColor Yellow
    
    $rcloneConfig = @"
[securepath-drive]
type = drive
scope = drive
token = {"access_token":"","token_type":"Bearer","refresh_token":"","expiry":""}
team_drive = 
"@

    # Create rclone config
    $configPath = "$env:APPDATA\rclone\rclone.conf"
    New-Item -ItemType Directory -Path "$env:APPDATA\rclone" -Force | Out-Null
    
    Write-Host "`nPlease run this command to authorise rclone with Google Drive:" -ForegroundColor Cyan
    Write-Host "C:\SecurePathUK\tools\rclone.exe config create securepath-drive drive" -ForegroundColor White
    Write-Host "Follow the prompts and authorise with your Google account." -ForegroundColor Yellow
    
    # After authorisation, create folders
    Write-Host "`nOnce authorised, run these commands to create folders:" -ForegroundColor Green
    
    foreach ($parent in $folders.Keys | Sort-Object) {
        Write-Host "rclone mkdir securepath-drive:/$parent" -ForegroundColor White
        foreach ($child in $folders[$parent]) {
            Write-Host "rclone mkdir `"securepath-drive:/$parent/$child`"" -ForegroundColor Gray
        }
    }
}

Create-GoogleDriveStructure
