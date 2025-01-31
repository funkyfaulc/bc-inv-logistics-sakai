//bc-inventory-logistics-app/bc-inv-logistics-sakai/demo/services/InventoryRecordsService.tsx

import { collection, getDocs, getDoc, addDoc, updateDoc, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';
import { InventoryRecord } from '../../types/inventoryRecords';
import { runTransaction } from 'firebase/firestore';
import { writeBatch } from "firebase/firestore";
import { Product } from '../../types/products';

const inventoryCollection = collection(db, 'inventory_records');

export const InventoryRecordsService = {
    async addInventoryRecord(record: InventoryRecord): Promise<void> {
        try {
            const totalUnits = (record.fba || 0) +
                   (record.inbound_to_fba || 0) +
                   (record.awd || 0) +
                   (record.inbound_to_awd || 0) +
                   (record.reserved_units || 0);  // ✅ Corrected version

                const sanitizedRecord = Object.fromEntries(
                    Object.entries({
                        ...record,
                        totalUnits, // 🔹 Ensure totalUnits is explicitly included
                        reserved_units: record.reserved_units || 0,
                        reserved_fc_transfer: record.reserved_fc_transfer || 0,
                        reserved_fc_processing: record.reserved_fc_processing || 0,
                        reserved_customer_order: record.reserved_customer_order || 0,
                    }).filter(([_, value]) => value !== undefined)
                );

            await addDoc(inventoryCollection, {
                ...sanitizedRecord,
                totalUnits,
                snapshotDate: sanitizedRecord.snapshotDate instanceof Date 
                    ? Timestamp.fromDate(sanitizedRecord.snapshotDate) 
                    : Timestamp.now(),
                createdAt: Timestamp.now().toDate(),
                updatedAt: Timestamp.now().toDate(),
            });
            console.log('Inventory record added successfully!');
        } catch (error) {
            console.error('Error adding inventory record:', error);
        }
    },

    async getInventoryRecords(): Promise<InventoryRecord[]> {
        try {
            const inventorySnapshot = await getDocs(inventoryCollection);
            const productSnapshot = await getDocs(collection(db, 'products_sk')); // Fetch products
    
            // Create a Map<ASIN, Product>
            const productMap = new Map<string, Product>();
            productSnapshot.docs.forEach((doc) => {
                const data = doc.data() as Product;
                if (data.asin) {
                    productMap.set(data.asin, data);
                }
            });
    
            return inventorySnapshot.docs.map((doc) => {
                const data = doc.data();
                const productData = productMap.get(data.asin) || {} as Product;
    
                return {
                    id: doc.id,
                    asin: data.asin || '',
                    sku: data.sku || '',
                    productType: productData.product || 'Uncategorized',  
                    totalUnits: data.totalUnits ?? 0,
                    fba: data.fba ?? 0,
                    inbound_to_fba: data.inbound_to_fba ?? 0,
                    awd: data.awd ?? 0,
                    inbound_to_awd: data.inbound_to_awd ?? 0,
                    reserved_units: data.reserved_units ?? 0,
                    reserved_fc_transfer: data.reserved_fc_transfer ?? 0,
                    reserved_fc_processing: data.reserved_fc_processing ?? 0,
                    reserved_customer_order: data.reserved_customer_order ?? 0,
                    snapshotDate: data.snapshotDate instanceof Timestamp ? data.snapshotDate.toDate() : new Date(),
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
                } as InventoryRecord;
            });
        } catch (error) {
            console.error("Error fetching inventory records:", error);
            return [];
        }
    },

    async updateInventoryRecord(
        id: string, 
        updates: Partial<Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>>,
        notes?: string
    ): Promise<void> {
        try {
            const docRef = doc(db, 'inventory_records', id);
            const snapshot = await getDoc(docRef);
            if (!snapshot.exists()) {
                console.error(`No record found with ID: ${id}`);
                return;
            }

            const existingData = snapshot.data() as InventoryRecord;


            const updatedFields = {
                ...updates,
                updatedAt: Timestamp.now(),
                notes: notes !== undefined ? notes : existingData.notes || '',
            };

            await updateDoc(docRef, updatedFields);
            console.log('Inventory record updated successfully!');
        } catch (error) {
            console.error('Error updating inventory record:', error);
        }
    },

    // **NEW FUNCTION: Update by ASIN**
    async updateInventoryRecordByAsin(
        asin: string, 
        updates: Partial<InventoryRecord>, 
        notes?: string
    ): Promise<void> {
        try {
            const inventoryQuery = query(inventoryCollection, where("asin", "==", asin));
            const snapshot = await getDocs(inventoryQuery);
    
            if (!snapshot.empty) {
                const docRef = doc(db, "inventory_records", snapshot.docs[0].id);
                await runTransaction(db, async (transaction) => {
                    const docSnapshot = await transaction.get(docRef);
                    if (!docSnapshot.exists()) return;
    
                    const existingData = docSnapshot.data() as InventoryRecord;
    
                    const totalUnits = 
                        (updates.fba ?? existingData.fba ?? 0) +
                        (updates.inbound_to_fba ?? existingData.inbound_to_fba ?? 0) +
                        (updates.awd ?? existingData.awd ?? 0) +
                        (updates.inbound_to_awd ?? existingData.inbound_to_awd ?? 0) +
                        (updates.reserved_units ?? existingData.reserved_units ?? 0);
    
                    transaction.update(docRef, {
                        ...updates,
                        totalUnits,
                        reserved_units: updates.reserved_units ?? existingData.reserved_units ?? 0,
                        reserved_fc_transfer: updates.reserved_fc_transfer ?? existingData.reserved_fc_transfer ?? 0,
                        reserved_fc_processing: updates.reserved_fc_processing ?? existingData.reserved_fc_processing ?? 0,
                        reserved_customer_order: updates.reserved_customer_order ?? existingData.reserved_customer_order ?? 0,
                        updatedAt: Timestamp.now(),
                        notes: notes !== undefined ? notes : existingData.notes || "",
                    });
                });
    
                console.log(`Inventory record updated for ASIN: ${asin}`);
            } else {
                console.warn(`No inventory record found for ASIN: ${asin}, adding a new record.`);
                await InventoryRecordsService.addInventoryRecord({
                    asin,
                    notes: notes || "",
                    createdAt: Timestamp.now().toDate(),
                    updatedAt: Timestamp.now().toDate(),
                    fba: updates.fba || 0,
                    inbound_to_fba: updates.inbound_to_fba || 0,
                    reserved_units: updates.reserved_units || 0,
                    snapshotDate: updates.snapshotDate || new Date(),
                    sku: updates.sku || "",
                    awd: updates.awd || 0,
                    inbound_to_awd: updates.inbound_to_awd || 0,
                });
            }
        } catch (error) {
            console.error("Error updating inventory record by ASIN:", error);
        }
    },

    async bulkUploadInventory(records: InventoryRecord[]): Promise<void> {
        try {
            console.time("Bulk Upload");
    
            // Step 1: Fetch all existing ASINs
            const snapshot = await getDocs(inventoryCollection);
            const existingRecords = new Map<string, string>(); // ASIN → Firestore Doc ID
    
            snapshot.docs.forEach((doc) => {
                const data = doc.data() as InventoryRecord;
                if (data.asin) {
                    existingRecords.set(data.asin, doc.id);
                }
            });
    
            console.log(`📌 Found ${existingRecords.size} existing inventory records.`);
    
            // Step 2: Prepare batch writes
            const batch = writeBatch(db);
            let batchCounter = 0;
    
            for (const record of records) {
                if (!record.asin) {
                    console.warn(`⚠️ Skipping record without ASIN:`, record);
                    continue;
                }
    
                let docRef;
                let isUpdate = false;
    
                if (existingRecords.has(record.asin)) {
                    // If ASIN exists, update the existing record
                    docRef = doc(db, "inventory_records", existingRecords.get(record.asin)!);
                    isUpdate = true;
                } else {
                    // If ASIN doesn't exist, create a new document
                    docRef = doc(inventoryCollection);
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
                    console.log("🔍 Existing Record:", existingRecords.get(record.asin));
                    console.log("📌 New Values:", updatedFields);
                } else {
                    console.log(`🆕 Creating new record for ASIN: ${record.asin}`);
                }
    
                batch.set(docRef, updatedFields, { merge: true });
                batchCounter++;
    
                // Step 3: Firestore batch limit handling
                if (batchCounter >= 500) {
                    await batch.commit();
                    console.log(`✅ Committed batch of 500 writes.`);
                    batchCounter = 0;
                }
            }
    
            // Final commit if there are remaining writes
            if (batchCounter > 0) {
                await batch.commit();
                console.log(`✅ Final batch committed.`);
            }
    
            console.timeEnd("Bulk Upload");
            console.log("✅ Bulk inventory upload/update complete.");
        } catch (error) {
            console.error("❌ Error in bulk inventory upload:", error);
        }
    }

};