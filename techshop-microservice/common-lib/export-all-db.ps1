# Export all TechShop MySQL databases
# Usage: .\export-all-db.ps1

$OutputDir = ".\db-exports"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ExportDir = "$OutputDir\$Timestamp"

# Create output directory
New-Item -ItemType Directory -Path $ExportDir -Force | Out-Null
Write-Host "Export directory: $ExportDir" -ForegroundColor Cyan

# Database list: container_name, database_name, host_port
$Databases = @(
    @{ Container = "techshop-mysql-user";         DB = "techshop_userdb";         Port = "3307" },
    @{ Container = "techshop-mysql-product";      DB = "techshop_productdb";      Port = "3308" },
    @{ Container = "techshop-mysql-order";        DB = "techshop_orderdb";        Port = "3309" },
    @{ Container = "techshop-mysql-cart";         DB = "techshop_cartdb";         Port = "3310" },
    @{ Container = "techshop-mysql-payment";      DB = "techshop_paymentdb";      Port = "3311" },
    @{ Container = "techshop-mysql-notification"; DB = "techshop_notificationdb"; Port = "3312" },
    @{ Container = "techshop-mysql-inventory";    DB = "techshop_inventorydb";    Port = "3313" },
    @{ Container = "techshop-mysql-ai";           DB = "techshop_aidb";           Port = "3314" }
)

$Password = "123456"
$Success = 0
$Failed  = 0

foreach ($item in $Databases) {
    $OutFile = "$ExportDir\$($item.DB).sql"
    Write-Host "Exporting $($item.DB)..." -NoNewline

    # Run mysqldump inside the container (pass password via env var to avoid shell escaping issues)
    $result = docker exec -e MYSQL_PWD=$Password $item.Container `
        mysqldump -uroot `
        --databases $item.DB `
        --routines --triggers --events `
        --single-transaction --set-gtid-purged=OFF 2>&1

    if ($LASTEXITCODE -eq 0) {
        $result | Out-File -FilePath $OutFile -Encoding utf8
        $size = (Get-Item $OutFile).Length / 1KB
        Write-Host " OK ($([math]::Round($size,1)) KB)" -ForegroundColor Green
        $Success++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $result" -ForegroundColor Yellow
        $Failed++
    }
}

Write-Host ""
Write-Host "Done: $Success exported, $Failed failed." -ForegroundColor Cyan
Write-Host "Files saved to: $ExportDir" -ForegroundColor Cyan

# Optional: zip everything
$ZipPath = "$OutputDir\techshop-db-$Timestamp.zip"
Compress-Archive -Path "$ExportDir\*" -DestinationPath $ZipPath -Force
Write-Host "Zipped to: $ZipPath" -ForegroundColor Magenta
