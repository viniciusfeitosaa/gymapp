@echo off
echo =======================================
echo  CONFIGURANDO GIT - GYMCONNECT
echo =======================================
echo.

cd /d "%~dp0"

echo [1/5] Configurando usuario do Git...
git config user.name "GymConnect Dev"
git config user.email "dev@gymconnect.app"

echo [2/5] Inicializando repositorio (se necessario)...
if not exist .git (
    git init -b main
)

echo [3/5] Adicionando arquivos...
git add .

echo [4/5] Criando commit inicial...
git commit -m "🎉 Initial commit - GymConnect

- Sistema completo para Personal Trainers
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + TypeScript + Vite + TailwindCSS
- Database: Neon PostgreSQL
- Docker: Frontend e Backend containerizados
- Design moderno com paleta azul escuro
- Autenticacao JWT completa
- Sistema de treinos e alunos
"

echo [5/5] Status final...
git status

echo.
echo =======================================
echo  Git configurado com sucesso!
echo =======================================
echo.
pause
