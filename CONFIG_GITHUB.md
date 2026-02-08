# 🔧 Configurar Git com GitHub

## 📋 PASSO A PASSO

### Opção 1: Script Automático (RECOMENDADO)

1. Execute o script:
```bash
.\config-github.bat
```

2. Digite seu **nome de usuário do GitHub**
3. Digite seu **email do GitHub** (o mesmo cadastrado no GitHub)

### Opção 2: Manual

```bash
# Substitua com suas informações
git config --global user.name "Seu Nome GitHub"
git config --global user.email "seu@email.github.com"
```

---

## 🔄 ATUALIZAR COMMIT ANTERIOR

Se você já fez um commit com as credenciais erradas:

```bash
# Atualizar o último commit com suas credenciais
git commit --amend --reset-author --no-edit

# Se JÁ fez push, force update (CUIDADO!)
git push --force
```

---

## ✅ VERIFICAR CONFIGURAÇÃO

```bash
# Ver configuração atual
git config --global user.name
git config --global user.email

# Ver todas as configurações
git config --global --list
```

---

## 📧 QUAL EMAIL USAR?

Use o **mesmo email cadastrado no GitHub**:

1. Acesse: https://github.com/settings/emails
2. Copie seu email principal
3. Use no comando `git config`

**Dica:** Se quiser manter email privado, GitHub oferece um email no formato:
```
ID+username@users.noreply.github.com
```

---

## 🔐 AUTENTICAÇÃO NO GITHUB

Para fazer push, você precisa configurar autenticação:

### Opção 1: GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Fazer login
gh auth login

# Seguir instruções na tela
```

### Opção 2: Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Generate new token (classic)
3. Marque: `repo`, `workflow`
4. Copie o token
5. Use como senha quando fazer `git push`

---

## 📤 FAZER PUSH PARA GITHUB

### 1. Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `GymConnect`
3. Descrição: `Sistema para Personal Trainers`
4. **NÃO** marque "Initialize with README"
5. Clique em "Create repository"

### 2. Conectar repositório local

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/GymConnect.git

# Verificar
git remote -v

# Fazer push
git push -u origin main
```

---

## 🚨 RESOLVER CONFLITO DE BRANCH

Se aparecer erro sobre "master" vs "main":

```bash
# Renomear branch para main
git branch -M main

# Fazer push
git push -u origin main
```

---

## 📊 HISTÓRICO DE COMMITS

Ver commits com autor:

```bash
git log --pretty=format:"%h - %an <%ae> : %s" --graph
```

---

## 🔄 REFAZER TODOS OS COMMITS (AVANÇADO)

Se você quer atualizar TODOS os commits (não apenas o último):

```bash
# CUIDADO: Isso reescreve o histórico!
git filter-branch --env-filter '
WRONG_EMAIL="dev@gymconnect.app"
NEW_NAME="Seu Nome"
NEW_EMAIL="seu@email.com"

if [ "$GIT_COMMITTER_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$NEW_NAME"
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$NEW_NAME"
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```

---

## ✅ CHECKLIST

- [ ] Configurar `git config --global user.name`
- [ ] Configurar `git config --global user.email`
- [ ] Atualizar commit anterior com `--amend`
- [ ] Criar repositório no GitHub
- [ ] Adicionar remote origin
- [ ] Fazer push para GitHub
- [ ] Verificar se commit aparece com seu perfil

---

## 📞 COMANDOS RÁPIDOS

```bash
# Ver config atual
git config --global user.name
git config --global user.email

# Mudar config
git config --global user.name "Novo Nome"
git config --global user.email "novo@email.com"

# Atualizar último commit
git commit --amend --reset-author --no-edit

# Ver remotes
git remote -v

# Adicionar remote
git remote add origin URL_DO_REPO

# Push
git push -u origin main
```

---

**Execute o script `config-github.bat` agora!** 🚀
