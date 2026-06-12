# Reenvio Apple — correções da rejeição (jun/2026)

## Rejeição build 12 (11/06/2026) — só 2.1(b) IAP

| Problema | Correção no código |
|----------|-------------------|
| Erro ao comprar assinatura no sandbox (iPad) | Plugin iOS envia JWS StoreKit 2 + IDs como string; backend valida JWS; retry na confirmação com servidor |

**Build corrigida:** **1.0.6 (14)**

**Confirme no App Store Connect:**
- **Acordos → Contrato de Apps Pagos** aceito
- Assinatura `gymcode_pro_monthly` ativa com localização
- Conta demo personal com assinatura expirada

**Resposta ao App Review (inglês):**

```
We fixed the in-app purchase error (Guideline 2.1b):

- iOS StoreKit 2 now sends the signed transaction (JWS) to our server after purchase
- Server validates the subscription product and activates Pro
- Purchase confirmation retries if the network is slow

Please test build 14 (1.0.6) with the demo personal account in App Review Information.
Paid Apps Agreement is accepted. Product ID: gymcode_pro_monthly.

Steps: Log in as personal → Perfil → Plano Pro → Assinar Pro agora.
```

---

## Rejeição mais recente (09/06/2026 — versão 1.0 build 9)

| Guideline | Problema | Correção |
|-----------|----------|----------|
| **3.1.2(c)** | Falta link de EULA nos **metadados** da App Store | Adicionar links na **descrição do app** no App Store Connect (ver abaixo) |
| **2.1(b)** | Erro ao comprar assinatura no sandbox (iPad) | Fluxo iOS ajustado + conferir produto `gymcode_pro_monthly` e **Paid Apps Agreement** |
| **2.3.10** | Menções à Google Play na tela de assinatura iOS | Textos da assinatura agora são **só App Store** no iOS |

---

## 1. Metadados App Store Connect (obrigatório — 3.1.2c)

Na ficha do app → **App iOS** → **Informações do app** / **Descrição**, adicione **no final**:

```
Termos de Uso: https://mygymcode.com/termos
Política de Privacidade: https://mygymcode.com/privacidade
EULA Apple (padrão): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

**URL Política de Privacidade** (campo dedicado):

```
https://mygymcode.com/privacidade
```

Se usar EULA customizado em vez do padrão Apple: **App Store Connect → App → Informações do app → Contrato de licença (EULA)**.

---

## 2. Acordo de Apps Pagos (2.1b)

**App Store Connect → Acordos, impostos e banking → Acordos**

- Aceite o **Paid Apps Agreement** (Contrato de apps pagos)
- Sem isso, compras sandbox falham na revisão

---

## 3. Assinatura no App Store Connect

| Campo | Valor |
|--------|--------|
| Product ID | `gymcode_pro_monthly` |
| Grupo | Gym Code Pro |
| Localização | Português (Brasil) + English (U.S.) com nome e descrição |
| Status | Ativo / pronto para envio |

Teste no iPhone/iPad com **Sandbox Apple ID** antes de reenviar.

---

## 4. Conta demo para revisão

**App Review Information → Sign-in required: Yes**

```
Personal trainer demo — EXPIRED subscription (free plan, 2 students max):

Email: SEU_EMAIL_DE_TESTE
Password: SUA_SENHA

Subscription test: Perfil → Plano Pro → Assinar Pro agora (sandbox).

Account deletion: Perfil → Excluir conta permanentemente.

Privacy: https://mygymcode.com/privacidade
Terms: https://mygymcode.com/termos
Apple EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

SQL para conta expirada:

```sql
UPDATE personal_trainers
SET "maxStudentsAllowed" = 2, "storeSubscriptionId" = NULL
WHERE email = 'review@gymcode.demo';
```

---

## 5. Nova build

```bash
cd frontend
npm run mobile:bundle:ios
```

Versão atual: **1.0.5** (build **10**)

No App Store Connect: selecionar build **10** na versão **1.0.5** → **Enviar para análise**.

---

## 6. Resposta sugerida ao App Review (inglês)

```
We addressed all three points:

1. Guideline 3.1.2(c): Added Terms of Use, Privacy Policy, and Apple Standard EULA links to the App Store description and in-app subscription screen.

2. Guideline 2.1(b): Fixed iOS subscription purchase flow; confirmed gymcode_pro_monthly is active and Paid Apps Agreement is accepted. Demo account has expired subscription for sandbox purchase testing.

3. Guideline 2.3.10: Removed all Google Play references from the subscription UI on iOS — only App Store wording is shown.

Please test with the demo account provided in App Review Information.
```

---

## Correções anteriores (ainda válidas)

| Guideline | Correção |
|-----------|----------|
| **2.1(a) Crash iPad** | `NSCameraUsageDescription` e `NSPhotoLibraryUsageDescription` no `Info.plist` |
| **5.1.1(v) Exclusão de conta** | Perfil → Excluir conta permanentemente |
| **3.1.2(c) In-app** | Links legais no painel de assinatura |
