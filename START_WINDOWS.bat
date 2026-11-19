@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Install Node.js 20.6 or newer from https://nodejs.org/ then run this file again.
 pause
 exit /b 1
)
echo Open http://localhost:3000 in Chrome after the server starts.
echo.
if exist .env (
  node --env-file=.env server.mjs
) else (
  echo Railway API key has not been added. Demo UI and official links are available.
  node server.mjs
)
pause
