@echo off
echo =======================================
echo  CORRIGINDO TAILWIND CSS - GYMAPP
echo =======================================
echo.

cd frontend

echo [1/4] Parando servidor anterior...
timeout /t 2 /nobreak > nul

echo [2/4] Limpando cache do npm...
call npm cache clean --force

echo [3/4] Reinstalando dependencias do Tailwind...
call npm install -D tailwindcss@latest postcss@latest autoprefixer@latest

echo [4/4] Iniciando servidor...
echo.
echo =======================================
echo  Acesse: http://localhost:5173
echo =======================================
echo.

call npm run dev
