@echo off
title GURUBARAN BUILDERS - Construction ERP & SQLite Database
echo ==========================================================
echo Starting GURUBARAN BUILDERS Personal Database Server...
echo Database File: %~dp0database\gurubaran_builders.db
echo ==========================================================
cd /d "%~dp0"

:: Start Node.js SQLite API Backend
start "" /b node server.js

:: Wait 1 second for database server to initialize
timeout /t 1 /nobreak >nul

:: Open in default web browser
start http://localhost:5000

echo Application is running at http://localhost:5000
echo Keep this window open or minimize it while working.
echo ==========================================================
pause
