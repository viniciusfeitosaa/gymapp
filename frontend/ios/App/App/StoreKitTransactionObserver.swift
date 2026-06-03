import Foundation
import StoreKit

/// Escuta Transaction.updates no launch (recomendação StoreKit 2).
/// Evita perder compras concluídas em background e remove o aviso do Xcode.
enum StoreKitTransactionObserver {
    private static var updatesTask: Task<Void, Never>?

    static func startListening() {
        guard updatesTask == nil else { return }

        if #available(iOS 15.0, *) {
            updatesTask = Task(priority: .background) {
                for await result in Transaction.updates {
                    await handleTransactionUpdate(result)
                }
            }
            NSLog("[StoreKit] Transaction.updates listener started")
        }
    }

    @available(iOS 15.0, *)
    private static func handleTransactionUpdate(_ result: VerificationResult<Transaction>) async {
        switch result {
        case .verified(let transaction):
            NSLog("[StoreKit] Verified transaction update: %llu product=%@", transaction.id, transaction.productID)
            await transaction.finish()
        case .unverified(let transaction, let error):
            NSLog(
                "[StoreKit] Unverified transaction %llu: %@",
                transaction.id,
                error.localizedDescription
            )
        }
    }
}
