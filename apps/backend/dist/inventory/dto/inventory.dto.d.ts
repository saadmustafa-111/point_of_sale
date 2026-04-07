import { InventoryType } from '../../common/enums';
export declare class CreateInventoryLogDto {
    productId: string;
    type: InventoryType;
    quantity: number;
    reason?: string;
}
