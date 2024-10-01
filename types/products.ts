// bc-inv-logistics-sakai/types/products.ts

import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp

export interface Product {
    id?: string; // Firestore document ID
    product: string;
    material?: string;
    color?: string;
    size?: string;
    asin?: string;
    sku?: string;
    upc?: string;
    optimalUnitsPerCarton?: number; // New field for carton tracking
    created_at?: Timestamp;
    updated_at?: Timestamp;
}