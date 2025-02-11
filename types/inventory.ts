// bc-inv-logistics-sakai/types/inventory.ts

import { Timestamp } from 'firebase/firestore';

// Represents a single inventory snapshot entry
export interface InventoryUpdate {
    id?: string; // Firestore document ID
    asin: string;
    sku: string;
    fnsku?: string;
    productName?: string;
    availableUnits: number;
    reservedUnits: number;
    inboundToFba?: number;
    inboundToAwd?: number;
    awdAvailable?: number;
    reservedFcTransfer?: number;
    reservedFcProcessing?: number;
    reservedCustomerOrder?: number;
    outboundToFba?: number;
    totalUnits?: number; // Computed field
    snapshotTimestamp: Timestamp; // When the snapshot was taken
    source?: "FBA" | "AWD"; // Indicates source of data
}