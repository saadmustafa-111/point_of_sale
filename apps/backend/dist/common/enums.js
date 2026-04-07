"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryType = exports.PaymentMethod = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["CASHIER"] = "CASHIER";
})(Role || (exports.Role = Role = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["INSTALLMENT"] = "INSTALLMENT";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var InventoryType;
(function (InventoryType) {
    InventoryType["STOCK_IN"] = "STOCK_IN";
    InventoryType["STOCK_OUT"] = "STOCK_OUT";
    InventoryType["ADJUSTMENT"] = "ADJUSTMENT";
})(InventoryType || (exports.InventoryType = InventoryType = {}));
//# sourceMappingURL=enums.js.map