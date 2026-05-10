@echo off
title Enterprise Workflow Hub - AI Server
echo ========================================
echo  Enterprise Workflow Hub - AI Server
echo ========================================
echo.
echo Stopping any old Node.js processes...
taskkill /F /IM node.exe 2>nul
echo Waiting for port to be released...
timeout /t 5 /nobreak >nul
echo.
echo Starting server - DO NOT CLOSE THIS WINDOW...
echo.
cd /d "C:\Users\meees\OneDrive\Desktop\ServiceNow\EnterpriseWorkflowHub"
node server.js
echo.
echo ==========================================
echo  Server has stopped. See error above.
echo  Press any key to close this window.
echo ==========================================
pause
