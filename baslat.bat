@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Ilk kurulum yapiliyor, bir kez surecek...
  call npm install
)
call npm start
