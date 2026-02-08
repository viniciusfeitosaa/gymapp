@echo off
echo =======================================
echo  GYMCONNECT - INICIAR PROJETO
echo =======================================
echo.

cd /d "%~dp0"

echo Escolha como iniciar:
echo.
echo 1. Com Docker (Recomendado)
echo 2. Manualmente (Backend + Frontend)
echo 3. Apenas Backend
echo 4. Apenas Frontend
echo 5. Prisma Studio (Visualizar Banco)
echo.
set /p choice="Digite sua escolha (1-5): "

if "%choice%"=="1" goto docker
if "%choice%"=="2" goto manual
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto frontend
if "%choice%"=="5" goto prisma
goto end

:docker
echo.
echo Iniciando com Docker...
docker-compose up --build
goto end

:manual
echo.
echo Iniciando manualmente...
echo.
echo Abrindo Backend em nova janela...
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
echo.
echo Abrindo Frontend em nova janela...
start cmd /k "cd frontend && npm run dev"
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
goto end

:backend
echo.
echo Iniciando apenas Backend...
cd backend
npm run dev
goto end

:frontend
echo.
echo Iniciando apenas Frontend...
cd frontend
npm run dev
goto end

:prisma
echo.
echo Abrindo Prisma Studio...
cd backend
npx prisma studio
goto end

:end
pause
