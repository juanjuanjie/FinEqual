@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=D:\environment;%PATH%"
echo 正在启动 Finance API Hub...
echo 启动成功后，请在浏览器打开终端中显示的 Local 地址。
call "D:\environment\npm.cmd" run dev
pause
