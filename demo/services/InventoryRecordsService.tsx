//bc-inventory-logistics-app/bc-inv-logistics-sakai/demo/services/InventoryRecordsService.tsx

import { collection, getDocs, getDoc, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';
import { InventoryRecord } from '../../types/inventoryRecords';

const inventoryCollection = collection(db, 'inventory_records');

export const InventoryRecordsService = {
    async addInventoryRecord(record: InventoryRecord): Promise<void> {
        try {
            const totalUnits = Object.values(record.breakdown).reduce((sum, count) => sum + count, 0); // Calculate total units
            await addDoc(inventoryCollection, {
                ...record,
                totalUnits,
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

    async updateInventoryRecord(id: string, updatedBreakdown: Partial<InventoryRecord['breakdown']>, notes?: string): Promise<void> {
        try {
            const docRef = doc(db, 'inventory_records', id);
            const snapshot = await getDoc(docRef);
            const existingData = snapshot.data() as InventoryRecord;

            const newBreakdown = {
                ...existingData.breakdown,
                ...updatedBreakdown, // Merge updated fields
            };
            const totalUnits = Object.values(newBreakdown).reduce((sum, count) => sum + count, 0);

            await updateDoc(docRef, {
                breakdown: newBreakdown,
                totalUnits,
                updatedAt: Timestamp.now(),
                notes,
            });

            console.log('Inventory record updated successfully!');
        } catch (error) {
            console.error('Error updating inventory record:', error);
        }
    },
};
