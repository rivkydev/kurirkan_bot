@echo off
setlocal EnableDelayedExpansion
title WhatsApp Bot System - Control Panel
color 0B

:MENU
cls
echo =================================================================
echo.
echo    ######  ##     ##    ###    ########  ########  
echo   ##    ## ###   ###   ## ##   ##     ##    ##     
echo   ##       #### ####  ##   ##  ##     ##    ##     
echo    ######  ## ### ## ##     ## ########     ##     
echo         ## ##     ## ######### ##   ##      ##     
echo   ##    ## ##     ## ##     ## ##    ##     ##     
echo    ######  ##     ## ##     ## ##     ##    ##     
echo.
echo            ########   #######  ######## 
echo            ##     ## ##     ##    ##    
echo            ########  ##     ##    ##    
echo            ##     ## ##     ##    ##    
echo            ########   #######     ##    
echo.
echo =================================================================
echo                   PREMIUM WHATSAPP BOT SYSTEM
echo =================================================================
echo.

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terinstall di komputer ini!
    echo Bot ini membutuhkan Node.js untuk berjalan.
    echo.
    echo Tekan tombol apa saja untuk membuka halaman download Node.js...
    pause >nul
    start https://nodejs.org/
    exit
)

:: Check dependencies
if not exist "node_modules\" (
    echo [INFO] Sistem mendeteksi komponen belum lengkap.
    echo [INFO] Menyiapkan instalasi otomatis...
    timeout /t 2 >nul
    goto INSTALL
)

echo [1] Mulai Bot ^& Web Dashboard
echo [2] Perbaiki / Install Ulang Komponen
echo [3] Buka Web Dashboard Manual
echo [4] Reset Data (Hapus semua orderan)
echo [0] Keluar
echo.
set /p choice="Pilih menu (0-4): "

if "%choice%"=="1" goto START_BOT
if "%choice%"=="2" goto INSTALL
if "%choice%"=="3" goto OPEN_WEB
if "%choice%"=="4" goto RESET
if "%choice%"=="0" exit
goto MENU

:START_BOT
cls
echo =================================================================
echo                 MENJALANKAN SISTEM BOT...
echo =================================================================
echo.
echo [INFO] Membuka browser ke http://localhost:3000...
start http://localhost:3000

echo [INFO] Memulai server bot... Jika tertutup sendiri, bot otomatis merestart.
echo.
:LOOP
node app.js
echo.
echo [WARNING] Bot terhenti atau mengalami crash! 
echo [INFO] Merestart otomatis dalam 5 detik...
timeout /t 5
goto LOOP

:INSTALL
cls
echo =================================================================
echo              MENGINSTALL KOMPONEN SISTEM
echo =================================================================
echo.
echo [INFO] Mohon tunggu, proses ini membutuhkan koneksi internet...
echo [INFO] Mengunduh modul utama...
call npm install
echo [INFO] Mengunduh browser internal (Puppeteer)...
call npm install puppeteer
echo.
echo [SUCCESS] Semua komponen berhasil diinstall!
pause
goto MENU

:OPEN_WEB
start http://localhost:3000
goto MENU

:RESET
cls
color 0C
echo =================================================================
echo                    PERINGATAN BAHAYA!
echo =================================================================
echo.
echo Apakah Anda yakin ingin MENGHAPUS SEMUA DATA bot?
echo (Semua histori orderan, driver, dan antrian akan hilang selamanya)
echo.
set /p confirm="Ketik 'YAKIN' untuk menghapus: "
if /I "%confirm%"=="YAKIN" (
    if exist "data\storage.json" (
        del "data\storage.json"
        echo [SUCCESS] Data berhasil direset!
    ) else (
        echo [INFO] Data sudah kosong, tidak ada yang dihapus.
    )
) else (
    echo [INFO] Penghapusan dibatalkan.
)
pause
color 0B
goto MENU
