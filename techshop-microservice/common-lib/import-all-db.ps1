# Import all TechShop MySQL databases
# Usage: .\import-all-db.ps1 -ImportDir ".\db-exports\20240101_120000"
# Or just run without param to pick the latest export folder automatically

param(
    [string]$ImportDir = ""
)

$Password = "123456"

# Auto-pick latest export folder if not specified
if ($ImportDir -eq "") {
    $Latest = Get-ChildItem -Path ".\db-exports" -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if ($null -eq $Latest) {
        Write-Host "No export folder found in .\db-exports" -ForegroundColor Red
        exit 1
    }
    $ImportDir = $Latest.FullName
}

Write-Host "Importing from: $ImportDir" -ForegroundColor Cyan
Write-Host ""

# container_name, database_name, sql_file
$Databases = @(
    @{ Container = "techshop-mysql-user";         DB = "techshop_userdb";         File = "techshop_userdb.sql" },
    @{ Container = "techshop-mysql-product";      DB = "techshop_productdb";      File = "techshop_productdb.sql" },
    @{ Container = "techshop-mysql-order";        DB = "techshop_orderdb";        File = "techshop_orderdb.sql" },
    @{ Container = "techshop-mysql-cart";         DB = "techshop_cartdb";         File = "techshop_cartdb.sql" },
    @{ Container = "techshop-mysql-payment";      DB = "techshop_paymentdb";      File = "techshop_paymentdb.sql" },
    @{ Container = "techshop-mysql-notification"; DB = "techshop_notificationdb"; File = "techshop_notificationdb.sql" },
    @{ Container = "techshop-mysql-inventory";    DB = "techshop_inventorydb";    File = "techshop_inventorydb.sql" },
    @{ Container = "techshop-mysql-ai";           DB = "techshop_aidb";           File = "techshop_aidb.sql" }
)

$Success = 0
$Failed  = 0
$Skipped = 0

foreach ($item in $Databases) {
    $SqlFile = Join-Path $ImportDir $item.File

    if (-not (Test-Path $SqlFile)) {
        Write-Host "SKIP $($item.DB) (file not found: $SqlFile)" -ForegroundColor Yellow
        $Skipped++
        continue
    }

    Write-Host "Importing $($item.DB)..." -NoNewline

    $result = Get-Content $SqlFile -Raw | docker exec -i -e MYSQL_PWD=$Password $item.Container mysql -uroot 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $Success++
    } else {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $result" -ForegroundColor Yellow
        $Failed++
    }
}

Write-Host ""
Write-Host "Done: $Success imported, $Failed failed, $Skipped skipped." -ForegroundColor Cyan
