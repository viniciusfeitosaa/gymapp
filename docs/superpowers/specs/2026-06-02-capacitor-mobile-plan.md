# Plano: Gym Code Mobile — Capacitor + WebView

**Data:** 2026-06-02  
**Status:** Fase 1 concluída · Fase 2 em progresso (plugin IAP instalado)  
**Contexto:** App web em https://mygymcode.com; assinaturas Pro via App Store / Google Play.

---

## Objetivo

Transformar o Gym Code em app nativo iOS/Android usando **Capacitor** com **WebView remota** (mesmo padrão do AppVS), mantendo o deploy web atual e habilitando IAP nativo nas lojas.

## Decisões de arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Conteúdo do WebView | URL remota `CAPACITOR_SERVER_URL` | UI atualiza sem release na loja |
| `webDir` | `dist` (build local mínimo) | Requisito do Capacitor mesmo com `server.url` |
| App ID | `com.gymcode.app` | Alinhado ao `.env.example` / Google Play |
| Billing | Plugin nativo + `window.GymCodeBilling` | Ponte já preparada em `nativeStoreBilling.ts` |
| .env | Manter como está por enquanto | Credenciais das lojas configuradas depois |

## Fases

### Fase 1 — Shell Capacitor (esta sessão)

1. Instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
2. Script `write-capacitor-config.mjs` (gera `capacitor.config.json` a partir de `CAPACITOR_SERVER_URL`)
3. Script `scripts/setup-capacitor-mobile.sh` para bootstrap
4. `npx cap add ios` + `npx cap add android`
5. Ajustes nativos mínimos:
   - iOS: `contentInset: always`, ATS HTTPS
   - Android: `cleartext: false`, `allowNavigation` para mygymcode.com
6. Scripts npm: `mobile:config`, `mobile:sync`, `mobile:open:ios`, `mobile:open:android`
7. Documentar variável `CAPACITOR_SERVER_URL=https://mygymcode.com/login` em `.env.example`

**Verificação Fase 1:**
```bash
cd frontend && npm run mobile:sync
npm run mobile:open:ios    # abre Xcode
npm run mobile:open:android # abre Android Studio
# Simulador/emulador carrega mygymcode.com sem ERR_CLEARTEXT
```

### Fase 2 — In-App Purchase (próxima sessão)

1. Escolher plugin: `@capgo/native-purchases` ou StoreKit/Billing Library via plugin Capacitor
2. Criar produto `gymcode_pro_monthly` na App Store Connect e Google Play Console
3. Implementar `window.GymCodeBilling.purchaseSubscription()` no bridge nativo
4. Fluxo: compra nativa → `POST /api/subscription/verify-purchase` → ativa Pro
5. Configurar webhooks Apple/Google no backend (já esboçados)
6. Testes sandbox Apple + licenciamento Google Play

**Verificação Fase 2:**
- Compra sandbox ativa Pro no perfil
- Cancelamento via loja + webhook rebaixa para gratuito

### Fase 3 — Publicação nas lojas

1. Ícones, splash screen, screenshots
2. Privacy policy URL (mygymcode.com)
3. App Store Connect + Google Play Console listing
4. TestFlight / internal testing
5. Submissão para review

---

## Arquivos a criar/alterar (Fase 1)

```
frontend/
  scripts/write-capacitor-config.mjs
  capacitor.config.json          # gerado
  ios/                           # cap add ios
  android/                       # cap add android
  package.json                   # deps + scripts
scripts/
  setup-capacitor-mobile.sh
.env.example                     # CAPACITOR_SERVER_URL
docs/superpowers/specs/2026-06-02-capacitor-mobile-plan.md
```

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Redirect HTTP no WebView | Garantir URL HTTPS final em `CAPACITOR_SERVER_URL` |
| Cookies/localStorage entre sessões | Mesmo domínio mygymcode.com; JWT em localStorage funciona no WKWebView |
| IAP não funciona no browser | UI já orienta usuário; botão nativo só no app |
| Credenciais das lojas ausentes | verify-purchase retorna erro claro até configurar `.env` |

---

## Checklist pós-Fase 1 (manual)

- [ ] Xcode: run no simulador iPhone
- [ ] Android Studio: run no emulador
- [ ] Login personal funciona no WebView
- [ ] Perfil → Assinatura exibe botões corretos
