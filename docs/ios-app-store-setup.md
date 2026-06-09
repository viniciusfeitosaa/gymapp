# Gym Code — Configuração iOS do zero (App Store Connect + assinatura)

Guia passo a passo para cadastrar o app na Apple e preparar a assinatura Pro **antes** de submeter à App Store.

---

## Valores fixos do projeto (não altere sem atualizar o código)

> **Nota:** `com.gymcode.app` já estava ocupado na Apple (outra conta). O projeto usa **`com.mygymcode.app`**, alinhado ao domínio mygymcode.com.

| Item | Valor |
|------|--------|
| Nome do app | **Gym Code** |
| Bundle ID | **`com.mygymcode.app`** |
| Product ID da assinatura | **`gymcode_pro_monthly`** |
| Grupo de assinatura | **Gym Code Pro** |
| Período | Mensal (1 mês) |
| Preço sugerido | R$ 29,90/mês |
| Plano gratuito | até 2 alunos |
| Plano Pro | alunos ilimitados (`maxStudentsAllowed = 999`) |

---

## Fase 0 — Pré-requisitos

1. **Conta Apple Developer Program** (US$ 99/ano)  
   - [developer.apple.com/programs](https://developer.apple.com/programs/)  
   - Sem isso não é possível publicar nem criar assinaturas reais.

2. **Mac com Xcode** instalado (versão recente).

3. **Projeto local pronto:**
   ```bash
   cd frontend
   npm install
   npm run mobile:sync
   npm run mobile:open:ios
   ```
   Abra sempre **`App.xcworkspace`** (não o `.xcodeproj`).

---

## Fase 1 — Registrar o App ID (Apple Developer)

1. Acesse [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**.

2. **Identifiers** → **+** → **App IDs** → **App**.

3. Preencha:
   - **Description:** Gym Code
   - **Bundle ID:** Explicit → **`com.mygymcode.app`**

4. Em **Capabilities**, marque:
   - **In-App Purchase** (obrigatório para assinatura)

5. **Register** e confirme.

---

## Fase 2 — Criar o app no App Store Connect

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com).

2. **Apps** → **+** → **Novo app**.

3. Preencha:
   - **Plataformas:** iOS
   - **Nome:** Gym Code
   - **Idioma principal:** Português (Brasil)
   - **Bundle ID:** selecione **`com.mygymcode.app`** (criado na Fase 1)
   - **SKU:** um código interno seu, ex. `gymcode-ios-001` (não aparece na loja)
   - **Acesso:** Acesso total (ou conforme sua conta)

4. **Criar**.

5. Na ficha do app, anote o **Apple ID** do app (número) — você usará depois em:
   ```env
   APP_STORE_URL=https://apps.apple.com/app/idSEU_APPLE_ID
   ```

---

## Fase 3 — Criar a assinatura Pro (In-App Purchase)

1. No App Store Connect, abra o app **Gym Code**.

2. Menu lateral → **Assinaturas** (ou **Monetização** → **Assinaturas**).

3. **Criar grupo de assinaturas:**
   - **Nome de referência:** Gym Code Pro
   - **Nome exibido ao usuário:** Gym Code Pro

4. Dentro do grupo → **Criar assinatura:**
   - **Nome de referência:** Gym Code Pro Mensal
   - **Product ID:** **`gymcode_pro_monthly`** ← deve ser **exatamente** este ID
   - **Duração:** 1 mês

5. **Preço:** selecione **R$ 29,90** (ou o tier equivalente na sua região).

6. **Localização (pt-BR):**
   - Nome: Gym Code Pro Mensal
   - Descrição: Alunos ilimitados e todos os recursos do app para personal trainers.

7. **Revisão da assinatura:** adicione uma captura de tela do painel de assinatura no app (pode enviar depois, ao submeter a versão).

8. Status da assinatura ficará **Pronta para envio** quando o app tiver uma build e os metadados estiverem completos.

> O arquivo local `frontend/ios/App/Configuration/GymCode.storekit` já usa o mesmo Product ID para testes no simulador.

---

## Fase 4 — Configurar o Xcode (signing + capability)

1. Abra `App.xcworkspace` no Xcode.

2. Selecione o target **App** → aba **Signing & Capabilities**:
   - **Team:** sua conta Developer
   - **Bundle Identifier:** `com.mygymcode.app`
   - Marque **Automatically manage signing**

3. **+ Capability** → adicione **In-App Purchase** (se ainda não aparecer).

4. Confirme **iOS Deployment Target ≥ 15.0** (StoreKit 2 / compras in-app exigem iOS 15+).

5. Para **testes no simulador** (sem App Store Connect ainda):
   - **Product → Scheme → Edit Scheme…**
   - **Run → Options → StoreKit Configuration:** `GymCode.storekit`
   - Com isso, **Assinar Pro agora** funciona no simulador com compra simulada.

6. Gere um build de teste: **Product → Run** no simulador ou dispositivo.

---

## Fase 5 — Testadores Sandbox (compras reais de teste)

Quando a assinatura existir no App Store Connect:

1. App Store Connect → **Usuários e acesso** → **Testadores do Sandbox** → **+**.

2. Crie um e-mail **que não seja** seu Apple ID principal (ex. `teste+gymcode@seudominio.com`).

3. No **iPhone físico** (não funciona igual no simulador para sandbox real):
   - **Ajustes → App Store → Conta Sandbox** → login com o testador
   - Abra o app → Perfil → **Assinar Pro agora**
   - A cobrança é **simulada** (não cobra cartão real).

---

## Fase 6 — Servidor (modo teste atual)

Enquanto validamos o fluxo, o backend em `mygymcode.com` está em modo sandbox:

```env
SUBSCRIPTION_PRODUCT_ID=gymcode_pro_monthly
APPLE_SANDBOX=1
STORE_BILLING_SANDBOX_TRUST=1
```

Isso aceita compras de **teste** (StoreKit 2 envia um ID numérico de transação).

**Antes de ir para produção na App Store**, será necessário:
- `APPLE_SANDBOX=0` e `STORE_BILLING_SANDBOX_TRUST=0`
- Implementar validação **App Store Server API v2** (próxima etapa de desenvolvimento)
- Configurar **App Store Server Notifications** apontando para `https://mygymcode.com/api/webhooks/apple`

---

## Fase 7 — TestFlight (recomendado antes da loja)

1. No Xcode: **Product → Archive** → **Distribute App** → **App Store Connect**.

2. No App Store Connect → **TestFlight** → adicione testadores internos.

3. Teste assinatura com conta Sandbox no build TestFlight.

---

## Checklist rápido

- [ ] Conta Apple Developer ativa
- [ ] App ID `com.mygymcode.app` com In-App Purchase
- [ ] App criado no App Store Connect
- [ ] Assinatura `gymcode_pro_monthly` no grupo Gym Code Pro
- [ ] Xcode: Team + capability In-App Purchase
- [ ] Teste no simulador com `GymCode.storekit`
- [ ] Testador Sandbox criado (para iPhone físico)
- [ ] (Depois) Build TestFlight + validação servidor produção

---

## Ordem sugerida para você agora

1. **Hoje:** Fases 0 → 1 → 2 (Developer + App Store Connect + criar app)
2. **Em seguida:** Fase 3 (criar assinatura `gymcode_pro_monthly`)
3. **No Mac:** Fase 4 (Xcode signing) + teste simulador
4. **Quando assinatura existir:** Fase 5 (Sandbox no iPhone)
5. **Depois:** implementamos validação Apple produção no servidor + TestFlight

---

## Documentação relacionada

- Testes StoreKit local: `docs/ios-storekit-testing.md`
