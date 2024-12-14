// bc-inv-logistics-sakai/types/inventory.ts

import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp

export interface InventoryUpdate {
    id?: string; // Firestore document ID
    asin: string;
    sku: string;
    availableUnits: number;
    reservedUnits: number;
    inboundUnits: number;
    timestamp: Timestamp; // Timestamp of the inventory update
}
