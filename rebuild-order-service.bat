@echo off
echo ==========================================
echo Rebuilding Order Service
echo ==========================================

cd techshop-microservice\order-service

echo.
echo Step 1: Building with Maven...
call mvn clean package -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo.
    echo Step 2: Please restart order-service
    echo.
    echo If running with Docker:
    echo   docker-compose restart order-service
    echo.
    echo If running directly:
    echo   1. Stop the current service (Ctrl+C^)
    echo   2. Run: java -jar target\order-service-0.0.1-SNAPSHOT.jar
    echo.
) else (
    echo.
    echo Build failed! Please check the errors above.
    exit /b 1
)

pause
