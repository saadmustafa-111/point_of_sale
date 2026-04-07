export declare class CreateProductDto {
    name: string;
    sku: string;
    barcode?: string;
    categoryId: string;
    brandId: string;
    purchasePrice: number;
    salePrice: number;
    stock: number;
    lowStockLimit?: number;
    warrantyMonths?: number;
    imageUrl?: string;
    isActive?: boolean;
    description?: string;
}
export declare class UpdateProductDto {
    name?: string;
    sku?: string;
    barcode?: string;
    categoryId?: string;
    brandId?: string;
    purchasePrice?: number;
    salePrice?: number;
    stock?: number;
    lowStockLimit?: number;
    warrantyMonths?: number;
    imageUrl?: string;
    isActive?: boolean;
    description?: string;
}
