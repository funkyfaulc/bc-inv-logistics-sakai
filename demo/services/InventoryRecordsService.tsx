import { collection, getDocs, getDoc, addDoc, updateDoc, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';
import { InventoryRecord } from '../../types/inventoryRecords';

const inventoryCollection = collection(db, 'inventory_records');

export const InventoryRecordsService = {
    async addInventoryRecord(record: InventoryRecord): Promise<void> {
        try {
            const totalUnits = record.breakdown
                ? Object.values(record.breakdown).reduce((sum, count) => sum + (count || 0), 0) 
                : 0;

                const sanitizedRecord = Object.fromEntries(
                    Object.entries({
                        ...record,
                        totalUnits // 🔹 Ensure totalUnits is explicitly included
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
        const snapshot = await getDocs(inventoryCollection);
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(), // 🔹 Convert Firestore Timestamp to Date
                updatedAt: data.updatedAt?.toDate() || new Date(), // 🔹 Convert Firestore Timestamp to Date
                snapshotDate: data.snapshotDate?.toDate() || new Date(),
            } as InventoryRecord;
        });
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

            const newBreakdown = {
                ...existingData.breakdown,
                ...(updates.breakdown || {}), 
            };

            const updatedFields = {
                ...updates,
                breakdown: newBreakdown,
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
        updates: Partial<Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>>,
        notes?: string
    ): Promise<void> {
        try {
            const inventoryQuery = query(inventoryCollection, where('asin', '==', asin));
            const snapshot = await getDocs(inventoryQuery);
    
            if (!snapshot.empty) {
                const docRef = doc(db, 'inventory_records', snapshot.docs[0].id);
                const existingData = snapshot.docs[0].data() as InventoryRecord;
    
                const newBreakdown = {
                    ...existingData.breakdown,
                    ...(updates.breakdown || {}),
                };
    
                const totalUnits = (updates.fba || existingData.fba || 0) +
                   (updates.inbound_to_fba || existingData.inbound_to_fba || 0) +
                   (updates.awd || existingData.awd || 0) +
                   (updates.inbound_to_awd || existingData.inbound_to_awd || 0);

                const updatedFields: any = {
                    ...updates,
                    breakdown: newBreakdown,
                    totalUnits,
                    updatedAt: Timestamp.now(),
                };

                // Ensure 'notes' is handled correctly
                updatedFields.notes = notes !== undefined ? notes : existingData.notes || '';

                // Ensure multiple SKUs are stored correctly
                if (updates.sku && existingData.sku && !existingData.sku.includes(updates.sku)) {
                    updatedFields.sku = `${existingData.sku}, ${updates.sku}`;
                } else {
                    updatedFields.sku = updates.sku || existingData.sku;
                }
    
                await updateDoc(docRef, updatedFields);
                console.log(`Inventory record updated for ASIN: ${asin}`);
            } else {
                console.warn(`No inventory record found for ASIN: ${asin}, adding a new record.`);
                await InventoryRecordsService.addInventoryRecord({
                    asin,
                    notes: notes || '',
                    createdAt: Timestamp.now().toDate(),
                    updatedAt: Timestamp.now().toDate(),
                    fba: updates.fba || 0,
                    inbound_to_fba: updates.inbound_to_fba || 0,
                    reserved_units: updates.reserved_units || 0,
                    breakdown: updates.breakdown || {},
                    snapshotDate: updates.snapshotDate || new Date(),
                    sku: updates.sku || '',
                    awd: updates.awd || 0,
                    inbound_to_awd: updates.inbound_to_awd || 0,
                });
            }
        } catch (error) {
            console.error('Error updating inventory record by ASIN:', error);
        }
    }
};