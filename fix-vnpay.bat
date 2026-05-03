@echo off
REM Fix VNPay Redirect Issue
REM This script adds payment_url column to orders table

echo ==========================================
echo Fix VNPay Redirect Issue
echo ==========================================
echo.

REM Database credentials
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=techshop_orderdb
set DB_USER=root

echo This script will:
echo 1. Add payment_url column to orders table
echo 2. Verify the column was added
echo.

REM Prompt for password
set /p DB_PASS="Enter MySQL root password: "
echo.

REM Create SQL file
echo USE %DB_NAME%; > temp_fix.sql
echo. >> temp_fix.sql
echo -- Check if column exists >> temp_fix.sql
echo SET @dbname = '%DB_NAME%'; >> temp_fix.sql
echo SET @tablename = 'orders'; >> temp_fix.sql
echo SET @columnname = 'payment_url'; >> temp_fix.sql
echo SET @preparedStatement = (SELECT IF( >> temp_fix.sql
echo   ( >> temp_fix.sql
echo     SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS >> temp_fix.sql
echo     WHERE >> temp_fix.sql
echo       (table_name = @tablename) >> temp_fix.sql
echo       AND (table_schema = @dbname) >> temp_fix.sql
echo       AND (column_name = @columnname) >> temp_fix.sql
echo   ) ^> 0, >> temp_fix.sql
echo   'SELECT ''Column already exists'' as message', >> temp_fix.sql
echo   CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(1000) NULL COMMENT ''VNPay payment URL for online payment'';') >> temp_fix.sql
echo )); >> temp_fix.sql
echo. >> temp_fix.sql
echo PREPARE alterIfNotExists FROM @preparedStatement; >> temp_fix.sql
echo EXECUTE alterIfNotExists; >> temp_fix.sql
echo DEALLOCATE PREPARE alterIfNotExists; >> temp_fix.sql
echo. >> temp_fix.sql
echo -- Verify the column >> temp_fix.sql
echo SELECT  >> temp_fix.sql
echo     COLUMN_NAME,  >> temp_fix.sql
echo     DATA_TYPE,  >> temp_fix.sql
echo     CHARACTER_MAXIMUM_LENGTH,  >> temp_fix.sql
echo     IS_NULLABLE, >> temp_fix.sql
echo     COLUMN_COMMENT >> temp_fix.sql
echo FROM INFORMATION_SCHEMA.COLUMNS >> temp_fix.sql
echo WHERE TABLE_SCHEMA = '%DB_NAME%'  >> temp_fix.sql
echo   AND TABLE_NAME = 'orders' >> temp_fix.sql
echo   AND COLUMN_NAME = 'payment_url'; >> temp_fix.sql

echo Running SQL script...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < temp_fix.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to execute SQL script
    del temp_fix.sql
    pause
    exit /b 1
)

REM Clean up
del temp_fix.sql

echo.
echo ==========================================
echo Fix completed successfully!
echo ==========================================
echo.
echo Next steps:
echo 1. Restart Order Service:
echo    cd techshop-microservice\order-service
echo    mvn spring-boot:run
echo.
echo 2. Test VNPay payment:
echo    - Go to http://localhost:5173/checkout
echo    - Select VNPay payment method
echo    - Click 'Dat hang ngay'
echo    - You should be redirected to VNPay
echo.
echo Done!
echo.
pause
