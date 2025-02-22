//bc-inventory-logistics-app/bc-inv-logistics-sakai/types/configs.ts


export interface ProductConfig {
    id?: string; // Optional because Firestore auto-generates it
    productType: string;
    size: string;
    unitsPerCarton: number;
    cartonCBM: number;
}
