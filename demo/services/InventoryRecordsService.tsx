//bc-inventory-logistics-app/bc-inv-logistics-sakai/demo/services/InventoryRecordsService.tsx

import { collection, getDocs, getDoc, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';
import { InventoryRecord } from '../../types/inventoryRecords';

const inventoryCollection = collection(db, 'inventory_records');

export const InventoryRecordsService = {
    async addInventoryRecord(record: InventoryRecord): Promise<void> {
        try {
            const totalUnits = record.breakdown
            ? Object.values(record.breakdown).reduce((sum, count) => sum + (count || 0), 0) 
            : 0; //default to 0 if breakdown is not provided
            await addDoc(inventoryCollection, {
                ...record,
                totalUnits,
                snapshotDate: record.snapshotDate || Timestamp.now(), //Use provided date or default snaphot date
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log('Inventory record added successfully!');
        } catch (error) {
            console.error('Error adding inventory record:', error);
        }
    },

    async getInventoryRecords(): Promise<InventoryRecord[]> {
        const snapshot = await getDocs(inventoryCollection);
        return snapshot.docs.map(
            (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                } as InventoryRecord)
        );
    },

    async updateInventoryRecord(
        id: string, 
        updates: Partial<Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>>,
        notes?: string
    ): Promise<void> {
        try {
            const docRef = doc(db, 'inventory_records', id);
            const snapshot = await getDoc(docRef);
            const existingData = snapshot.data() as InventoryRecord;

            const newBreakdown = {
                ...existingData.breakdown,
                ...(updates.breakdown || {}), // Merge breakdown if provided
            };

            const updatedFields = {
                ...updates, //Include top-level updates like `fba`
                breakdown: newBreakdown, //Updated breakdown
                updatedAt: Timestamp.now(), //Update timestamp
                notes,
            };
                        
            await updateDoc(docRef,updatedFields);
            
            console.log('Inventory record updated successfully!');
        } catch (error) {
            console.error('Error updating inventory record:', error);
        }
    },
};
