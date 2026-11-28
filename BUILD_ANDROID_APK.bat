@echo off
title RailPlus - Android APK ^& AAB Build Script
color 0b
echo =================================================================
echo       RailPlus - Android Release Build (APK ^& AAB Bundle)
echo =================================================================
echo.

set JAVA_HOME=C:\Users\Haris\.jdk17\jdk-17.0.21.1+2
if not exist "%JAVA_HOME%\bin\java.exe" (
    set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
)
set PATH=%JAVA_HOME%\bin;%PATH%

echo [*] Using Java JDK: %JAVA_HOME%
echo [*] Building signed Release APK and AAB Bundle...
echo.

cd /d "%~dp0android"
call gradlew.bat assembleRelease bundleRelease

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] Build Failed! Check the errors above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [*] Copying and naming build artifacts version-wise...
for /f "delims=" %%f in ('dir /b /s "%~dp0android\app\build\outputs\apk\release\railplus-v*.apk"') do (
    copy /y "%%f" "%~dp0railplus.apk" >nul
    copy /y "%%f" "%~dp0%%~nxf" >nul
    copy /y "%%f" "%~dp0website\railplus.apk" >nul
    echo [OK] APK Created: %%~nxf and railplus.apk (also updated in website/)
)

for /f "delims=" %%f in ('dir /b /s "%~dp0android\app\build\outputs\bundle\release\app-release.aab"') do (
    copy /y "%%f" "%~dp0railplus.aab" >nul
    copy /y "%%f" "%~dp0railplus-v1.0.0.aab" >nul
    echo [OK] AAB Bundle Created: railplus-v1.0.0.aab and railplus.aab
)

echo.
echo =================================================================
echo   SUCCESS! All release files are ready in project root:
echo.
echo   1. railplus.apk       - Signed Release APK (for phone testing)
echo   2. railplus.aab       - Signed Release Bundle (for Google Play Console)
echo   3. railplus-v1.0.0.apk
echo   4. railplus-v1.0.0.aab
echo =================================================================
echo.
pause
