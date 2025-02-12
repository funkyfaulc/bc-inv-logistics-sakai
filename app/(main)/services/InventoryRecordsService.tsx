import {
    collection, getDocs, addDoc, updateDoc, query, where,
    doc, Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import { InventoryRecord } from '@/types/inventoryRecords';
import { Product } from '@/types/products';

const inventoryCollection = collection(db, 'inventory_records');
const fbaInventoryCollection = collection(db, 'fba_inventory');
const awdInventoryCollection = collection(db, 'awd_inventory');
const salesVelocityCollection = collection(db, 'sales_velocity');
const productsCollection = collection(db, 'products_sk');



export const InventoryRecordsService = {
   /** ✅ Fetch all inventory records with product details */
    async getInventoryRecords(): Promise<InventoryRecord[]> {
        try {
            console.log("🔄 Fetching inventory records...");

            const inventorySnapshot = await getDocs(inventoryCollection);
            const fbaSnapshot = await getDocs(fbaInventoryCollection);
            const awdSnapshot = await getDocs(awdInventoryCollection);
            const productSnapshot = await getDocs(productsCollection); // ✅ Fetch products

            const salesVelocityMap = await this.getSalesVelocity();

            // Convert FBA, AWD, and Product collections into maps for easy merging
            const fbaMap = new Map<string, any>();
            fbaSnapshot.docs.forEach(doc => fbaMap.set(doc.id, doc.data()));

            const awdMap = new Map<string, any>();
            awdSnapshot.docs.forEach(doc => awdMap.set(doc.id, doc.data()));

            const productMap = new Map<string, any>();
            productSnapshot.docs.forEach(doc => {
                const data = doc.data();
                productMap.set(data.asin, data);
            });

            console.log("✅ Product Map Loaded:", productMap); // 🔍 Debugging the product map

            // ✅ Merge all records
            const mergedRecords: InventoryRecord[] = inventorySnapshot.docs.map(doc => {
                const record = doc.data() as InventoryRecord;
                const fbaData = fbaMap.get(record.asin) || {};
                const awdData = awdMap.get(record.asin) || {};
                const productData = productMap.get(record.asin) || {}; // Get product details

                console.log(
                    `🔍 ASIN: ${record.asin} - Product Data:`,
                    productData.product, productData.size, productData.color, productData.material
                ); // 🔍 Debugging each product

                return {
                    asin: record.asin,
                    sku: record.sku ?? "Unknown SKU",
                    productType: productData.product ?? "Unknown Product",
                    size: productData.size ?? "Unknown Size",
                    color: productData.color ?? "Unknown Color",
                    material: productData.material ?? "Unknown Material",
                    fba: fbaData.fba ?? 0,
                    inbound_to_fba: fbaData.inbound_to_fba ?? 0,
                    reserved_units: fbaData.reserved_units ?? 0,
                    awd: awdData.awd ?? 0,
                    inbound_to_awd: awdData.inbound_to_awd ?? 0,
                    totalUnits:
                        (fbaData.fba ?? 0) +
                        (fbaData.inbound_to_fba ?? 0) +
                        (awdData.awd ?? 0) +
                        (awdData.inbound_to_awd ?? 0) +
                        (fbaData.reserved_units ?? 0),
                    reserved:
                        (fbaData.reserved_units ?? 0) +
                        (fbaData.reserved_fc_transfer ?? 0) +
                        (fbaData.reserved_fc_processing ?? 0),
                    salesVelocity: salesVelocityMap.get(record.asin) ?? 0,
                    snapshotDate: record.snapshotDate ? new Date(record.snapshotDate) : new Date(),
                    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
                    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),

                    // ✅ Sellerboard-style Merged Product Display
                    productDisplay: `${record.asin} - ${record.sku} | ${productData.product ?? "Unknown"} - ${productData.size ?? "Unknown"} - ${productData.color ?? "Unknown"} (${productData.material ?? "Unknown"})`,
                };
            });

            return mergedRecords;
        } catch (error) {
            console.error("❌ Error fetching inventory records:", error);
            return [];
        }
    },

   /** ✅ Fetch sales velocity data */
    async getSalesVelocity(): Promise<Map<string, number>> {
        try {
            const snapshot = await getDocs(salesVelocityCollection);

            const salesVelocityMap = new Map<string, number>();
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                if (data.asin && data.salesVelocity) {
                    salesVelocityMap.set(data.asin, data.salesVelocity);
                }
            });

            console.log("✅ Sales Velocity Data Loaded:", salesVelocityMap);
            return salesVelocityMap;
        } catch (error) {
            console.error("❌ Error fetching sales velocity:", error);
            return new Map();
        }
    },

    /** ✅ Add a single inventory record */
    async addInventoryRecord(record: InventoryRecord): Promise<void> {
        try {
            if (!record.asin || record.asin === "ASIN" || record.asin.trim() === "") {
                console.warn(`⚠️ Skipping invalid ASIN:`, record);
                return;
            }

            const totalUnits =
                (record.fba ?? 0) +
                (record.inbound_to_fba ?? 0) +
                (record.awd ?? 0) +
                (record.inbound_to_awd ?? 0) +
                (record.reserved_units ?? 0);

            const updatedRecord = {
                ...record,
                totalUnits,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            await addDoc(inventoryCollection, updatedRecord);
            await addDoc(fbaInventoryCollection, updatedRecord);
            await addDoc(awdInventoryCollection, updatedRecord);

            console.log("✅ Inventory record added:", record.asin);
        } catch (error) {
            console.error("❌ Error adding inventory record:", error);
        }
    },

    /** ✅ Update an existing inventory record */
    async updateInventoryRecord(id: string, updates: Partial<InventoryRecord>): Promise<void> {
        try {
            const docRef = doc(db, "inventory_records", id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: Timestamp.now(),
            });

            console.log("✅ Inventory record updated:", id);
        } catch (error) {
            console.error("❌ Error updating inventory record:", error);
        }
    },

    /** ✅ Optimized bulk upload for inventory records, FBA, and AWD */
    async bulkUploadInventory(records: InventoryRecord[]): Promise<void> {
        try {
            console.time("Bulk Upload");

            // Fetch existing ASINs in each collection
            const snapshot = await getDocs(inventoryCollection);
            const existingRecords = new Map<string, string>(); // ASIN → Firestore Doc ID

            snapshot.docs.forEach((doc) => {
                const data = doc.data() as InventoryRecord;
                if (data.asin) {
                    existingRecords.set(data.asin, doc.id);
                }
            });

            console.log(`📌 Found ${existingRecords.size} existing inventory records.`);

            // Prepare batch writes
            const batchInventory = writeBatch(db);
            const batchFBA = writeBatch(db);
            const batchAWD = writeBatch(db);
            let batchCounter = 0;
            let skippedRecords = 0;

            for (const record of records) {
                if (!record.asin || record.asin === "ASIN" || record.asin.trim() === "") {
                    console.warn(`⚠️ Skipping invalid ASIN:`, record);
                    skippedRecords++;
                    continue;
                }

                let docRef;
                let isUpdate = false;

                if (existingRecords.has(record.asin)) {
                    docRef = doc(inventoryCollection, record.asin);
                    isUpdate = true;
                } else {
                    docRef = doc(inventoryCollection, record.asin); // ✅ Force ASIN as doc ID even for new records
                }

                const totalUnits =
                    (record.fba ?? 0) +
                    (record.inbound_to_fba ?? 0) +
                    (record.awd ?? 0) +
                    (record.inbound_to_awd ?? 0) +
                    (record.reserved_units ?? 0);

                const updatedFields = {
                    ...record,
                    totalUnits,
                    updatedAt: Timestamp.now(),
                    snapshotDate: record.snapshotDate ? Timestamp.fromDate(record.snapshotDate) : Timestamp.now(),
                };

                if (isUpdate) {
                    console.log(`🔄 Updating ASIN: ${record.asin}`);
                } else {
                    console.log(`🆕 Creating new record for ASIN: ${record.asin}`);
                }

                batchInventory.set(docRef, updatedFields, { merge: true });

                // ✅ Also write to FBA and AWD collections separately
                const fbaDocRef = doc(fbaInventoryCollection, record.asin);
                const awdDocRef = doc(awdInventoryCollection, record.asin);

                batchFBA.set(fbaDocRef, {
                    asin: record.asin,
                    sku: record.sku,
                    fba: record.fba ?? 0,
                    inbound_to_fba: record.inbound_to_fba ?? 0,
                    reserved_units: record.reserved_units ?? 0,
                    reserved_fc_transfer: record.reserved_fc_transfer ?? 0,
                    reserved_fc_processing: record.reserved_fc_processing ?? 0,
                    reserved_customer_order: record.reserved_customer_order ?? 0,
                    snapshotDate: updatedFields.snapshotDate,
                    updatedAt: updatedFields.updatedAt,
                }, { merge: true });

                batchAWD.set(awdDocRef, {
                    asin: record.asin,
                    sku: record.sku,
                    awd: record.awd ?? 0,
                    inbound_to_awd: record.inbound_to_awd ?? 0,
                    snapshotDate: updatedFields.snapshotDate,
                    updatedAt: updatedFields.updatedAt,
                }, { merge: true });

                batchCounter++;

                if (batchCounter >= 500) {
                    await batchInventory.commit();
                    await batchFBA.commit();
                    await batchAWD.commit();
                    console.log(`✅ Committed batch of 500 writes.`);
                    batchCounter = 0;
                }
            }

            if (batchCounter > 0) {
                await batchInventory.commit();
                await batchFBA.commit();
                await batchAWD.commit();
                console.log(`✅ Final batch committed.`);
            }

            console.timeEnd("Bulk Upload");
            console.log(`✅ Bulk inventory upload/update complete. Skipped ${skippedRecords} invalid records.`);
        } catch (error) {
            console.error("❌ Error in bulk inventory upload:", error);
        }
    },

    /** ✅ Bulk Upload Sales Velocity */
    async bulkUploadSalesVelocity(salesData: { asin: string, sku: string, salesVelocity: number }[]): Promise<void> {
        try {
            console.time("Bulk Upload Sales Velocity");
            const batch = writeBatch(db);

            salesData.forEach(({ asin, sku, salesVelocity }) => {
                if (!asin || asin === "ASIN" || asin.trim() === "") {
                    console.warn(`⚠️ Skipping invalid ASIN:`, asin);
                    return;
                }

                const docRef = doc(salesVelocityCollection, asin);
                batch.set(docRef, {
                    asin,
                    sku,
                    salesVelocity,
                    snapshotDate: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            });

            await batch.commit();
            console.timeEnd("Bulk Upload Sales Velocity");
            console.log(`✅ Sales Velocity Upload Complete.`);
        } catch (error) {
            console.error("❌ Error in bulk sales velocity upload:", error);
        }
    },

};
