@echo off
cd /d "%~dp0"
set "PATH=D:\environment;%PATH%"
echo Starting FinEqual documentation site...
echo Keep this window open while viewing the site.
echo Open the Local URL shown below in your browser.
call "D:\environment\npm.cmd" run dev
echo.
echo The site server has stopped.
pause
