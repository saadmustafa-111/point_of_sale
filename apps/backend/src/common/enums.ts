// Local enum definitions (SQLite doesn't support DB-level enums)
export enum Role {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSTALLMENT = 'INSTALLMENT',
}

export enum InventoryType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}
