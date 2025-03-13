// bc-inv-logistics-sakai/types/products.ts
import { Timestamp } from 'firebase/firestore';

export interface Product {
    id: string;
    product: string;
    material?: string;
    color?: string;
    size?: string;
    asin?: string;
    sku?: string;
    upc?: string;
    validColors?: string[];
    validSizes?: string[];
    created_at?: Timestamp;
    updated_at?: Timestamp;
    unitsPerCarton: number;
}

// ✅ Simplified ProductType without `MaterialConfig`
export interface ProductType {
    id?: string;
    product: string;

    // ✅ Products that only have ONE material
    validColors?: string[];
    validSizes?: string[];
    metersPerSize?: { [key: string]: number };
    material?: string;

    // ✅ Products with multiple materials (e.g., Pillowcases)
    materials?: {
        [key: string]: {
            validColors?: string[]; // ✅ Optional to prevent errors
            validSizes?: string[];
            metersPerSize?: { [key: string]: number };
        };
    };
}

// ✅ Ensure this is in products.ts

export interface MaterialConfig {
    validColors: string[]; // Required
    validSizes: string[];  // Required
    metersPerSize?: { [key: string]: number }; // Optional
}
