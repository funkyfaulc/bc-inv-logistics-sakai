//bc-inventory-logistics-app/bc-inv-logistics-sakai/demo/services/ProductService.tsx

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../app/firebase'; // Two directories up from demo/service
import { Product } from 'types/products'; // Import Product interface

// Firestore collection reference
const productCollection = collection(db, 'products_sk');

export const ProductService = {
    // Fetch all products from Firestore
    async getProducts(): Promise<Product[]> {
        const snapshot = await getDocs(productCollection);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
    },

    // Add a new product to Firestore
    async addProduct(product: Omit<Product, 'id'>): Promise<void> {
        try {
            console.log('Attempting to add product:', product); // Add this
            await addDoc(productCollection, {
                ...product,
                created_at: serverTimestamp(), // Set created_at timestamp
                updated_at: serverTimestamp() // Set updated_at timestamp
            });
            console.log('Product added successfully!'); // Add this
        } catch (error) {
            console.error('Error adding product:', error);
        }
    },

    // Update an existing product in Firestore
    async updateProduct(productId: string, updatedProduct: Product): Promise<void> {
        try {
            const productDoc = doc(db, 'products_sk', productId);
            await updateDoc(productDoc, {
                ...updatedProduct,
                updated_at: serverTimestamp() // Update the updated_at timestamp
            });
        } catch (error) {
            console.error('Error updating product:', error);
        }
    },

    // Delete a product from Firestore
    async deleteProduct(productId: string): Promise<void> {
        try {
            const productDoc = doc(db, 'products_sk', productId);
            await deleteDoc(productDoc); // This deletes from Firestore
            console.log(`Deleted product with ID: ${productId}`);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
};
