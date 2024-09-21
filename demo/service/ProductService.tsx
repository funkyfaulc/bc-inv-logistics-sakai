import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../app/firebase';  // Two directories up from demo/service

//Define the product interface
interface Product {
    id?: string;
    product: string;
    material?: string;
    color?: string;
    size?: string;
    asin?: string;
    sku?: string;
    upc?: string;
    created_at?: any;  // You can refine this type based on the Firestore timestamp type
    updated_at?: any;
  }

// Firestore collection reference
const productCollection = collection(db, 'products_sk');

export const ProductService = {
    // Fetch all products from Firestore
    async getProducts(): Promise<Product[]> {
        const snapshot = await getDocs(productCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    },

    // Add a new product to Firestore
    async addProduct(product: Product): Promise<void> {
        try {
            console.log("Attempting to add product:", product);  // Add this
            await addDoc(productCollection, {
                ...product,
                created_at: serverTimestamp(),  // Set created_at timestamp
                updated_at: serverTimestamp()   // Set updated_at timestamp
            });
            console.log("Product added successfully!");  // Add this
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
                updated_at: serverTimestamp()   // Update the updated_at timestamp
            });
        } catch (error) {
            console.error('Error updating product:', error);
        }
    },

    // Delete a product from Firestore
    async deleteProduct(productId: string): Promise<void> {
        try {
            const productDoc = doc(db, 'products_sk', productId);
            await deleteDoc(productDoc);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
};


