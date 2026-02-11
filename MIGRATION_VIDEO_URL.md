# Migration - Adicionar videoUrl aos Exercícios

## O que foi alterado?

Foi adicionado o campo `videoUrl` no modelo `Exercise` para permitir que você inclua links de vídeos do YouTube nos exercícios.

## Como aplicar a migration?

### 1. No terminal do backend, execute:

```bash
cd backend
npx prisma migrate dev --name add-video-url-to-exercise
```

### 2. Aguarde a migration ser aplicada

A migration irá:
- Adicionar a coluna `videoUrl` na tabela `exercises`
- Gerar o Prisma Client atualizado

### 3. Reinicie o servidor backend

```bash
npm run dev
```

## ✅ Pronto!

Agora você pode criar treinos com links do YouTube!

### Como usar:

1. Acesse a página "Treinos" no menu
2. Clique em "Criar Primeiro Treino" ou "Novo Treino"
3. Preencha os dados do treino
4. Adicione exercícios
5. Para cada exercício, você pode adicionar uma **URL do YouTube**
6. Salve o treino!

## Observações:

- A URL do vídeo é opcional
- Aceita qualquer URL válida (preferencialmente do YouTube)
- O campo está disponível tanto no frontend quanto no backend
