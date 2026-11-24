@echo off
rem Starts the portfolio for local development: the website on http://localhost:5173 and the chatbot/contact API on http://localhost:5000.
rem Double-click this file. Two minimized windows open; close them to stop the servers.
cd /d "%~dp0"
start "Portfolio website (5173)" /min cmd /k "cd /d %~dp0frontend && npm run dev -- --host --port 5173"
start "Portfolio API (5000)" /min cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 6 >nul
start http://localhost:5173
