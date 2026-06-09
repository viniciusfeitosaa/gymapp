# Gym Code — Google Play Store (do zero)

Guia para publicar o **Gym Code** na Google Play, com assinatura Pro via Google Play Billing.

---

## Valores fixos do projeto

| Item | Valor |
|------|--------|
| Nome do app | **Gym Code** |
| Package name | **`com.mygymcode.app`** |
| Product ID da assinatura | **`gymcode_pro_monthly`** |
| Base plan ID | **`monthly`** |
| Preço sugerido | R$ 29,90/mês |
| Política de privacidade | `https://mygymcode.com/privacidade` |
| Site | `https://mygymcode.com/landing/` |

---

## Fase 0 — Pré-requisitos

1. **Conta Google Play Console** — taxa única de US$ 25  
   [play.google.com/console](https://play.google.com/console)

2. **Android Studio** instalado no Mac

3. **Projeto local:**
   ```bash
   cd frontend
   npm install
   npm run mobile:sync:android
   npm run mobile:open:android
   ```

---

## Fase 1 — Criar o app na Play Console

1. Play Console → **Criar app**
2. Preencha:
   - **Nome:** Gym Code
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Gratuito ou pago:** Gratuito (a receita vem da assinatura in-app)
3. Aceite as políticas → **Criar app**

4. Menu **Painel** — complete as tarefas obrigatórias (configuração do app).

---

## Fase 2 — Package name

O package **`com.mygymcode.app`** é definido na **primeira upload** do AAB. Não dá para mudar depois.

Confirme no Android Studio: **app/build.gradle** → `applicationId "com.mygymcode.app"`.

---

## Fase 3 — Assinatura Pro (Google Play Billing)

1. Play Console → seu app → **Monetização** → **Produtos** → **Assinaturas**
2. **Criar assinatura**
3. Preencha:

| Campo | Valor |
|--------|--------|
| **ID do produto** | `gymcode_pro_monthly` |
| **Nome** | Gym Code Pro Mensal |
| **Descrição** | Assinatura mensal para personal trainers. Alunos ilimitados, fichas de treino, área do aluno personalizada e todos os recursos. |

4. **Plano base** → **Adicionar plano base**:
   - **ID do plano base:** `monthly` ← obrigatório bater com o código
   - **Tipo:** Renovação automática
   - **Período:** 1 mês
   - **Preço:** R$ 29,90 (Brasil)

5. **Ativar** a assinatura e o plano base.

> O app envia `planIdentifier: 'monthly'` na compra Android (`storePurchase.ts`).

---

## Fase 4 — Keystore (assinatura do AAB)

A Play Store exige AAB assinado. **Guarde o keystore — se perder, não atualiza o app.**

### Gerar keystore (uma vez)

```bash
keytool -genkey -v -keystore gymcode-release.keystore -alias gymcode -keyalg RSA -keysize 2048 -validity 10000
```

Guarde em local seguro (ex.: `~/keystores/gymcode-release.keystore`), **fora do git**.

### Configurar no projeto

```bash
cd frontend/android
cp keystore.properties.example keystore.properties
# Edite keystore.properties com caminhos e senhas
```

O `build.gradle` usa `keystore.properties` automaticamente no build **release**.

---

## Fase 5 — Build AAB para a loja

Use **modo bundled** (app embarca o frontend — necessário para IAP estável):

```bash
cd frontend
npm run mobile:sync:android
```

No **Android Studio**:

1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle**
3. Selecione o keystore
4. **release** → **Create**

Ou via terminal (com `keystore.properties` configurado):

```bash
cd frontend/android
./gradlew bundleRelease
```

O AAB fica em: `app/build/outputs/bundle/release/app-release.aab`

---

## Fase 6 — Upload na Play Console

1. **Teste e lançamento** → **Teste interno** (recomendado primeiro)
2. **Criar nova versão**
3. Envie o **app-release.aab**
4. **Nome da versão:** 1.0
5. **Notas da versão:** primeira versão do Gym Code para personal trainers.

Depois de validar, promova para **Produção** ou **Teste fechado**.

---

## Fase 7 — Ficha da loja (textos prontos)

### Título (30 caracteres)

```
Gym Code - Personal Trainer
```

### Descrição curta (80 caracteres)

```
Fichas de treino, alunos e app personalizado para personal trainers.
```

### Descrição completa (4000 caracteres)

```
O Gym Code é a plataforma feita para personal trainers que querem profissionalizar a rotina, encantar alunos e escalar sem perder o controle.

Chega de planilhas soltas e prints perdidos no WhatsApp. Centralize fichas, alunos, acompanhamento e a experiência do aluno no celular — com a SUA marca.

PARA O PERSONAL TRAINER
• Cadastre alunos e envie código de acesso pelo WhatsApp
• Monte fichas de treino por dia da semana
• Personalize logo e cores na visão do aluno
• Controle pagamento e bloqueie acesso de inadimplentes
• Acompanhe treinos realizados

PARA O ALUNO
• Acesso simples com código de 5 caracteres
• Treino do dia e modo foco
• App personalizado com a marca do personal

PLANOS
• Gratuito: até 2 alunos
• Pro (assinatura mensal): alunos ilimitados

Pagamento seguro via Google Play. Cancele quando quiser em play.google.com → Assinaturas.

Política de privacidade: https://mygymcode.com/privacidade
```

### Categoria

**Saúde e fitness**

### E-mail de contato

Seu e-mail de suporte (ex.: `noreply@mygymcode.com`)

### URL da política de privacidade

```
https://mygymcode.com/privacidade
```

### Gráfico de recursos (1024×500)

Banner promocional — pode usar logo + texto “Gym Code” (criar no Canva/Figma).

### Screenshots

Obrigatório: pelo menos 2 capturas de telefone (1080×1920 ou similar).  
Sugestão: login, painel do personal, área do aluno, tela Plano Pro.

---

## Fase 8 — Servidor (validação de compras Android)

Para a assinatura Pro **ativar no backend** após compra real, configure no servidor:

```env
GOOGLE_PLAY_PACKAGE_NAME=com.mygymcode.app
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/caminho/para/service-account.json
SUBSCRIPTION_PRODUCT_ID=gymcode_pro_monthly
```

### Criar service account

1. [Google Cloud Console](https://console.cloud.google.com) → projeto (ou crie um)
2. **IAM → Contas de serviço** → **Criar**
3. Baixe o JSON da chave
4. Play Console → **Configurações** → **Acesso à API** → vincule o projeto Google Cloud
5. **Convidar usuário** → e-mail da service account → permissão **Gerenciar pedidos e assinaturas** (ou Financeiro)

6. No Mac Mini (Docker), monte o JSON e aponte `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

Sem isso, a compra na Play funciona na loja, mas o app **não ativa Pro** no servidor.

---

## Fase 9 — Testadores (antes da produção)

1. Play Console → **Teste interno** → **Testadores** → lista de e-mails Gmail
2. Instale pelo link de teste interno
3. Compras de teste: use **licença de teste** em **Configurações → Teste de licença** (contas de teste não são cobradas)

---

## Fase 10 — Notificações em tempo real (opcional)

Para cancelamentos automáticos no servidor:

1. Google Cloud → **Pub/Sub** → tópico
2. Play Console → **Monetização → Configurações** → RTDN → tópico Pub/Sub
3. Push para `https://mygymcode.com/api/webhooks/google`

---

## Checklist

- [ ] Conta Play Console ativa
- [ ] App criado
- [ ] Assinatura `gymcode_pro_monthly` + plano base `monthly`
- [ ] Keystore gerado e `keystore.properties` configurado
- [ ] AAB release gerado (`npm run mobile:sync:android` + signed bundle)
- [ ] Upload teste interno
- [ ] Ficha da loja + privacidade + screenshots
- [ ] Service account no servidor (Pro ativa após compra)
- [ ] Teste de compra com conta licença de teste

---

## Ordem sugerida agora

1. **Criar app** na Play Console  
2. **Criar assinatura** `gymcode_pro_monthly` / `monthly`  
3. **Gerar keystore** + build AAB  
4. **Teste interno** + testar assinatura  
5. **Service account** no servidor  
6. **Produção**

---

## Documentação relacionada

- iOS: `docs/ios-app-store-setup.md`
- Privacidade: `https://mygymcode.com/privacidade`
