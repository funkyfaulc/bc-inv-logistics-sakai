//bc-inventory-logistics-app/bc-inv-logistics-sakai/types/inventoryRecords.ts

export interface InventoryRecord {
    id?: string; // Firestore document ID
    asin: string; // ASIN for linking to a product
    sku?: string; // Optional SKU for internal identification
    productType?: string; // Product type 
    fba: number; // Available units at FBA
    inbound_to_fba: number; // Total inbound units to FBA
    reserved_units: number; // Total reserved units at FBA
    reserved_fc_transfer?: number; // Reserved for FC transfer
    reserved_fc_processing?: number; // Reserved in FC processing
    reserved_customer_order?: number; // Reserved for customer orders
    inbound_working?: number; // Units working inbound to FBA
    inbound_shipped?: number; // Units shipped to FBA
    inbound_received?: number; // Units received at FBA
    awd?: number; // Available units at AWD
    inbound_to_awd?: number; // Total inbound units to AWD
    snapshotDate: Date; // Date of the report snapshot
    createdAt: Date; // Record creation timestamp
    updatedAt: Date; // Last updated timestamp
    notes?: string; // Additional notes
    totalUnits?: number;
    //sourceFileName?: string; // Removed 1-24-25
}
