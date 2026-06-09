# Reenvio Apple — correções da rejeição (jun/2026)

## O que foi corrigido no app

| Guideline | Correção |
|-----------|----------|
| **2.1(a) Crash iPad — Take Photo** | `NSCameraUsageDescription` e `NSPhotoLibraryUsageDescription` no `Info.plist`; upload de logo ajustado |
| **5.1.1(v) Exclusão de conta** | Seção **Excluir conta permanentemente** visível em Perfil (personal e aluno) |
| **3.1.2(c) Assinatura** | Links Privacidade, Termos e EULA Apple no painel de assinatura + detalhes do plano |
| **2.1 Demo expirada** | Conta de demonstração abaixo (configurar no App Store Connect) |

---

## Texto para colar em App Review Information (App Store Connect)

### Sign-in required — YES

**User name:** `review@gymcode.demo`  
**Password:** `(defina uma senha e crie a conta, ou use sua conta de teste)`

**Notas para o revisor:**

```
Demo account (personal trainer) — subscription EXPIRED (free plan, 2 students max):

Email: SEU_EMAIL_DE_TESTE
Password: SUA_SENHA

Steps to test subscription:
1. Log in as personal trainer
2. Go to Perfil (bottom tab)
3. Scroll to "Plano Pro" → tap "Assinar Pro agora"
4. Complete sandbox purchase (Sandbox Apple ID on device)

Account deletion:
1. Perfil tab → section "Excluir conta" → "Excluir conta permanentemente"
2. Follow 4-step confirmation (type EXCLUIR + password)

Privacy: https://mygymcode.com/privacidade
Terms: https://mygymcode.com/termos
Apple EULA: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Logo upload (iPad fix): Perfil → Logo do personal → Escolher da galeria (camera now has permission strings).
```

### Criar conta demo com assinatura expirada

No servidor, a conta deve ter:
- `maxStudentsAllowed = 2` (plano gratuito)
- `storeSubscriptionId = null`

Exemplo SQL (ajuste o e-mail):

```sql
UPDATE personal_trainers
SET "maxStudentsAllowed" = 2, "storeSubscriptionId" = NULL
WHERE email = 'review@gymcode.demo';
```

Ou use sua conta `viniciusalves919@gmail.com` já rebaixada para gratuito.

---

## Metadados App Store Connect

**URL Política de Privacidade:**
```
https://mygymcode.com/privacidade
```

**Na descrição do app, adicionar ao final:**
```
Termos de Uso: https://mygymcode.com/termos
EULA Apple: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

---

## Nova build

1. `cd frontend && npm run mobile:bundle:ios`  
   (ou `npm run mobile:sync:ios` + Xcode → Archive → Upload)
2. Versão **1.0.4**, build **8**
3. Selecionar build na versão 1.0.4 no App Store Connect
4. Responder à mensagem de rejeição no App Store Connect explicando as correções

---

## Gravação para Apple (opcional mas recomendado)

Grave no iPhone físico:
1. Login com conta demo
2. Perfil → Excluir conta → fluxo completo (pode cancelar no último passo)
3. Perfil → Assinar Pro → tela com links legais visíveis

Anexe em **App Review Information → Notes** ou responda ao ticket.
