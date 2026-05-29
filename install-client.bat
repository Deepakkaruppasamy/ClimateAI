@echo off
echo Installing client dependencies...
cd /d "%~dp0client"
call npm install
echo Done!
