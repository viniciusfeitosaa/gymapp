# Design: Login cleanup + Register wizard (Apple light)

**Data:** 2026-06-02  
**Status:** Aguardando revisão do usuário  
**Escopo:** Frontend (`/login`, `/register`) — sem mudanças de API

---

## Contexto

O cadastro de personal (`RegisterPage.tsx`) hoje usa 2 passos, mas o primeiro exibe quase todos os campos de uma vez (nome, e-mail, senha, telefone, CREF). O sucesso usa `alert()`. A experiência não transmite onboarding premium.

O login (`LoginPage.tsx`) exibe link “← Voltar para a página inicial” na tela de escolha de perfil — o usuário pediu remoção apenas desse link.

---

## Objetivos

1. Remover link “Voltar para a página inicial” no login (tela Personal / Aluno).
2. Transformar `/register` em wizard storytelling, claro e minimalista (referência Apple ID / Health).
3. Coletar **os mesmos dados** e enviar o **mesmo payload** para `POST /auth/personal/register`.
4. Substituir `alert()` por tela de celebração com CTA para login.

## Fora de escopo

- Redesign da tela de login (permanece tema escuro atual).
- Remover “← Voltar para Gym Code” (volta à escolha de perfil — **mantido**).
- Novos campos ou mudanças no backend.
- Cadastro de aluno (continua só via código do personal).

---

## Decisões validadas com o usuário

| Decisão | Escolha |
|---------|---------|
| Login — o que remover | Só “← Voltar para a página inicial” (opção A) |
| Estrutura do wizard | 4 etapas de dados + boas-vindas + celebração (opção A) |
| Visual do cadastro | Claro minimalista Apple (opção B) |
| Abordagem técnica | Shell reutilizável + steps isolados (recomendado B) |

---

## Parte 1 — Login

### Mudança

Remover o bloco em `LoginPage.tsx` (tela `userType === null`):

```tsx
<Link to="/" className="...">
  ← Voltar para a página inicial
</Link>
```

### Inalterado

- Link/botão “← Voltar para Gym Code” nas telas de e-mail/senha ou código do aluno.
- Fluxos personal, aluno, forgot-password, lockout de aluno.

---

## Parte 2 — Wizard de cadastro

### Mapa de telas

| Índice | ID interno | UI label | Campos | Botão principal |
|--------|------------|----------|--------|-----------------|
| 0 | `welcome` | (sem barra) | Nenhum | **Começar** |
| 1 | `identity` | Etapa 1 de 4 | `name*`, `email*` | **Continuar** |
| 2 | `access` | Etapa 2 de 4 | `password*`, `confirmPassword*`, `phone`, `cref` | **Continuar** |
| 3 | `address` | Etapa 3 de 4 | `postalCode`, `address`, `addressNumber`, `complement`, `province` | **Criar minha conta** |
| 4 | `celebration` | Etapa 4 de 4 (barra completa) | Nenhum | **Entrar no Gym Code** → `/login` |

\* = obrigatório (mesmas regras atuais).

### Validação por etapa

**Identidade**

- `name`: trim, não vazio.
- `email`: formato válido (HTML5 + trim).

**Acesso**

- `password`: mínimo 6 caracteres.
- `confirmPassword`: igual a `password`.
- `phone`, `cref`: opcionais (sem validação extra).

**Endereço**

- Todos opcionais (comportamento atual).
- CEP: on blur, ViaCEP preenche logradouro/bairro (lógica existente reutilizada).

Erros exibidos em banner dentro do card (fundo vermelho suave), não `alert()`.

### Submit

Disparado na etapa **Endereço** (“Criar minha conta”):

```ts
POST /auth/personal/register
{
  name, email, password,
  phone?, cref?,
  address?, addressNumber?, complement?, province?,
  postalCode? // apenas dígitos
}
```

- **Sucesso:** avança para `celebration` (não redireciona imediatamente).
- **Erro API:** permanece em `address`, banner com mensagem do backend.

### Navegação

- **Voltar:** visível nas etapas 1–4; na etapa 1 volta para `welcome`; na `celebration` oculto.
- **Continuar:** etapas 1–2; valida antes de avançar.
- Estado do formulário persiste ao voltar/avançar (single source of truth no wizard).

### Progresso visual

- Barra segmentada: 4 tracinhos (identidade → acesso → endereço → celebração).
- Texto auxiliar: “Etapa X de 4” nas telas 1–4.
- `welcome`: sem barra (intro antes do fluxo numerado).

### Transições

- Slide horizontal + fade (~300ms) entre steps.
- `prefers-reduced-motion: reduce` → troca instantânea, sem animação.

---

## Parte 3 — Visual (cadastro claro)

### Paleta e superfícies

| Token | Valor / uso |
|-------|-------------|
| Fundo página | `#F5F5F7` (off-white) |
| Card | `#FFFFFF`, `rounded-3xl`, sombra `shadow-lg` |
| Texto primário | `#1D1D1F` |
| Texto secundário | `#6E6E73` |
| Borda input | `#D2D2D7` |
| Focus ring | accent do tema (ring suave) |
| Botão primário | sólido escuro ou accent; cantos `rounded-xl`/`2xl` |
| Botão secundário / Voltar | ghost ou texto cinza |

### Tipografia

- Título etapa: grande, semibold (`text-2xl`/`3xl`).
- Subtítulo: cinza, 1–2 linhas de storytelling.
- Labels: pequenos, semibold, estilo iOS.

### Layout responsivo

- Mobile: card com margem `p-4`, largura total.
- Desktop: `max-w-lg` centrado verticalmente.
- Inputs full-width; grids só onde já faz sentido (senhas lado a lado em `sm+`).

### Contraste intencional

- Landing (escura/marketing) → **Cadastro claro** → Login escuro → App logada.

---

## Parte 4 — Copy (rascunho aprovável)

| Tela | Título | Subtítulo |
|------|--------|-----------|
| Boas-vindas | Vamos montar seu espaço profissional | Em poucos passos você estará pronto para treinar alunos com organização. |
| Identidade | Como podemos te chamar? | Seu nome aparecerá para os alunos no app. |
| Acesso | Proteja sua conta | Telefone e CREF são opcionais, mas ajudam na credibilidade. |
| Endereço | Quase lá | Endereço para cobranças futuras — pode pular se preferir. |
| Celebração | {name}, sua jornada começa agora | Fichas, alunos e treinos no WhatsApp — tudo em um só lugar. |

CTA celebração: **Entrar no Gym Code**.

Link rodapé (etapas 1–4): “Já tem cadastro? Faça login” → `/login`.

---

## Parte 5 — Arquitetura de arquivos

```
frontend/src/pages/register/
  RegisterPage.tsx           # export default, monta RegisterWizard
  RegisterWizard.tsx         # state, step machine, submit, validação
  RegisterWizardShell.tsx    # layout, progress, botões Voltar/Continuar
  registerTypes.ts           # RegisterFormData, RegisterStep enum
  registerValidation.ts      # funções puras de validação por step
  steps/
    WelcomeStep.tsx
    IdentityStep.tsx
    AccessStep.tsx
    AddressStep.tsx
    CelebrationStep.tsx
```

`RegisterPage.tsx` na raiz `pages/` pode re-exportar de `./register/RegisterPage` ou ser substituído — manter rota `/register` inalterada em `App.tsx`.

### Dependências

- Nenhuma biblioteca nova (Tailwind + Lucide existentes).
- Reutilizar `GymCodeIcon`, `api`, helpers CEP/ViaCEP.

---

## Parte 6 — Tratamento de erros

| Cenário | Comportamento |
|---------|---------------|
| Validação local | Banner no card; foco no primeiro campo inválido |
| E-mail já cadastrado (API) | Banner; usuário permanece em `address` ou volta manualmente |
| Rede / 500 | Mensagem genérica amigável |
| CEP inválido / ViaCEP falha | Silencioso (como hoje); usuário preenche manual |

---

## Parte 7 — Testes manuais (checklist pós-implementação)

- [ ] Login: link “página inicial” ausente; “Voltar para Gym Code” funciona.
- [ ] Wizard: avançar/voltar preserva dados.
- [ ] Validações: senhas, e-mail, campos obrigatórios.
- [ ] CEP preenche endereço.
- [ ] Submit com sucesso → celebração com nome → login.
- [ ] Submit com erro → banner, sem celebração.
- [ ] Mobile 375px e desktop 1280px legíveis.
- [ ] `prefers-reduced-motion` respeitado.

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| RegisterPage.tsx antigo grande | Migrar por arquivos novos; deletar lógica antiga ao final |
| Contraste login claro/escuro confuso | Manter escopos separados; só `/register` usa tema claro |
| Regressão API | Payload idêntico ao atual; teste manual de cadastro |

---

## Próximo passo (após aprovação do spec)

Invocar skill **writing-plans** para plano de implementação incremental (login primeiro → shell → steps → celebração → polish).
