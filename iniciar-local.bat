@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install
)
echo.
echo Projeto de Anamnese disponivel em http://localhost:3000
echo Mantenha esta janela aberta durante o uso.
echo.
call npm run dev
