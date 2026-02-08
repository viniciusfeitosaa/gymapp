@echo off
echo =======================================
echo  GYMCONNECT - SETUP COMPLETO
echo =======================================
echo.
echo Este script vai configurar todo o projeto!
echo.
pause

cd /d "%~dp0"

echo.
echo [1/6] Instalando dependencias do Backend...
cd backend
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo.
echo [2/6] Configurando banco de dados (Prisma)...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ERRO nas migrations! Verifique a DATABASE_URL no .env
    pause
    exit /b 1
)

echo.
echo [3/6] Gerando Prisma Client...
call npx prisma generate

echo.
echo [4/6] Voltando para raiz...
cd ..

echo.
echo [5/6] Instalando dependencias do Frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias do frontend!
    pause
    exit /b 1
)

cd ..

echo.
echo [6/6] Setup concluido com sucesso!
echo.
echo =======================================
echo  GYMCONNECT PRONTO PARA USO!
echo =======================================
echo.
echo Proximos passos:
echo.
echo 1. Iniciar com Docker:
echo    docker-compose up --build
echo.
echo 2. OU iniciar manualmente:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo.
echo 3. Acessar:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
pause
