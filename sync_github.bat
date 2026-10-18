@echo off
chcp 65001 >nul
echo ========================================================
echo   SPORTPASS - TỰ ĐỘNG ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push_to_github.ps1" %*
pause
