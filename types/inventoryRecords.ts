//bc-inventory-logistics-app/bc-inv-logistics-sakai/types/inventoryRecords.ts

export interface InventoryRecord {
    id?: string; // Firestore document ID
    asin: string; // ASIN for linking to a product
    sku?: string; // SKU for inventory identification
    totalUnits?: number; // Total units across all categories (optional as it's calculated in the service)
    breakdown: {
        production: number; // Units in production
        inbound_to_awd: number; // Units inbound to AWD
        awd: number; // Units in AWD
        fba: number; // Units in FBA
    };
    createdAt?: Date; // Record creation timestamp (optional as it's added in the service)
    updatedAt?: Date; // Last updated timestamp (optional as it's added in the service)
    notes?: string; // Additional notes
}
