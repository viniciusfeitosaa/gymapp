# 🚀 Como subir o GymApp para o GitHub

## Passo 1: Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `GymApp` (ou o nome que preferir)
3. ❌ NÃO marque nenhuma das opções (README, .gitignore, license)
4. Clique em "Create repository"

## Passo 2: Conectar e fazer push

Execute os comandos abaixo no PowerShell (dentro desta pasta):

```powershell
# Adicionar o remote do GitHub
git remote add origin https://github.com/viniciusfeitosaa/GymApp.git

# Fazer push
git push -u origin main
```

**⚠️ Importante:** Substitua `GymApp` na URL se escolheu outro nome.

## ✅ Pronto!

Seu código estará no GitHub com:
- Todos os commits com seu nome: **viniciusfeitosaa**
- Apenas os arquivos essenciais do projeto
- Histórico limpo e organizado
