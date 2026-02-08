@echo off
echo =======================================
echo  CONFIGURAR GIT COM GITHUB
echo =======================================
echo.
echo Este script vai configurar seu Git com suas credenciais do GitHub
echo.

set /p username="Digite seu nome de usuario do GitHub: "
set /p email="Digite seu email do GitHub: "

echo.
echo Configurando Git...
echo.

git config --global user.name "%username%"
git config --global user.email "%email%"

echo.
echo =======================================
echo  Configuracao concluida!
echo =======================================
echo.
echo Nome configurado: %username%
echo Email configurado: %email%
echo.
echo Verificando configuracao:
git config --global user.name
git config --global user.email
echo.
echo =======================================
echo  IMPORTANTE: Atualizar commit anterior
echo =======================================
echo.
echo Para atualizar o commit anterior com suas credenciais:
echo.
echo 1. Execute: git commit --amend --reset-author --no-edit
echo 2. Se ja fez push: git push --force
echo.
pause
