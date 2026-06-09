# Testar assinatura Pro no iOS (simulador / Xcode)

> Cadastro na Apple do zero: veja **`docs/ios-app-store-setup.md`**.  
> Google Play: veja **`docs/google-play-setup.md`**.


## Arquivo local (já no projeto)

- `frontend/ios/App/Configuration/GymCode.storekit`
- Produto: **`gymcode_pro_monthly`** (assinatura mensal)

O scheme **App** já aponta para esse arquivo em **Run → Options → StoreKit Configuration**.

## Passos no Xcode

1. Abra o workspace (não só o `.xcodeproj`):
   ```bash
   cd frontend && npm run mobile:open:ios
   ```
   Use **App.xcworkspace**.

2. Confirme o StoreKit:
   - **Product → Scheme → Edit Scheme…**
   - Aba **Run** → **Options**
   - **StoreKit Configuration** = `GymCode.storekit`

3. **Product → Clean Build Folder**, depois **Run** no simulador.

4. No app: Perfil → **Assinar Pro agora** (compra simulada, sem cobrança real).

O app inicia um listener `Transaction.updates` no launch (`StoreKitTransactionObserver.swift`), conforme a Apple recomenda — isso evita o aviso no console e compras perdidas em background.

## Dispositivo físico / TestFlight

Crie o mesmo Product ID em **App Store Connect** → assinaturas auto-renováveis → `gymcode_pro_monthly`, vinculado ao app `com.mygymcode.app`. Use conta **Sandbox** em Ajustes → App Store.

## Backend (testes)

No `.env` do servidor:

```env
APPLE_SANDBOX=1
STORE_BILLING_SANDBOX_TRUST=1
SUBSCRIPTION_PRODUCT_ID=gymcode_pro_monthly
```
