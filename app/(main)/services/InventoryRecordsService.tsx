import {
    collection, getDocs, addDoc, updateDoc, query, where,
    doc, Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import { InventoryRecord } from '@/types/inventoryRecords';

const inventoryCollection = collection(db, 'inventory_records');
const fbaInventoryCollection = collection(db, 'fba_inventory');
const awdInventoryCollection = collection(db, 'awd_inventory');

export const InventoryRecordsService = {
    /** ✅ Fetch all inventory records */
    async getInventoryRecords(): Promise<InventoryRecord[]> {
        try {
            const snapshot = await getDocs(inventoryCollection);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as InventoryRecord),
            }));
        } catch (error) {
            console.error("❌ Error fetching inventory records:", error);
            return [];
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
};
