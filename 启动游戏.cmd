@echo off
cd /d "%~dp0"
node scripts/build.mjs
if errorlevel 1 goto failed
echo.
echo Open http://localhost:4173 in your browser.
echo Keep this window open while playing.
node scripts/serve.mjs
:failed
pause
