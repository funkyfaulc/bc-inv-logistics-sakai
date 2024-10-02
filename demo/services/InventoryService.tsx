// bc-inv-logistics-sakai/app/services/InventoryService.tsx

import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../app/firebase'; // Adjust path as necessary

export interface InventoryUpdate {
    id?: string;
    asin: string; // Product identifier
    sku: string; // Product identifier
    availableUnits: number;
    reservedUnits: number;
    inboundUnits: number;
    timestamp: Timestamp; // Timestamp of the inventory update
}

// Firestore collection reference for inventory updates
const inventoryCollection = collection(db, 'inventory_updates');

export const InventoryService = {
    // Add a new inventory update to Firestore
    async addInventoryUpdate(inventoryUpdate: InventoryUpdate): Promise<void> {
        try {
            await addDoc(inventoryCollection, {
                ...inventoryUpdate,
                timestamp: Timestamp.now(), // Store timestamp of when the inventory was updated
            });
            console.log('Inventory update added successfully!');
        } catch (error) {
            console.error('Error adding inventory update:', error);
        }
    },

    // Fetch all inventory updates
    async getInventoryUpdates(): Promise<InventoryUpdate[]> {
        const snapshot = await getDocs(inventoryCollection);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as InventoryUpdate));
    },
};