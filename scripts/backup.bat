
@echo off
setlocal

REM Ubicarse en la raiz del proyecto
cd /d "%~dp0.."

REM Leer MONGODB_URL desde .env
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="MONGODB_URL" set "MONGODB_URL=%%b"
    )
)

REM Eliminar comillas simples y dobles accidentales
set "MONGODB_URL=%MONGODB_URL:'=%"
set "MONGODB_URL=%MONGODB_URL:"=%"

REM Verificar la URI
if not defined MONGODB_URL (
    echo ERROR: No se encontro MONGODB_URL en .env
    pause
    exit /b 1
)

REM Crear fecha y hora para evitar mezclar respaldos
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "FECHA=%%i"

REM Crear carpeta de respaldo
if not exist "resguardos_tpi\%FECHA%" mkdir "resguardos_tpi\%FECHA%"

REM Realizar el respaldo de foodstore
mongodump --uri="%MONGODB_URL%" --db=foodstore --out="resguardos_tpi\%FECHA%"

if errorlevel 1 (
    echo.
    echo ERROR: No se pudo completar el respaldo.
    pause
    exit /b 1
)

echo.
echo Backup finalizado correctamente.
echo Ubicacion: resguardos_tpi\%FECHA%
pause
