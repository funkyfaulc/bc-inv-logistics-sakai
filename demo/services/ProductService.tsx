import { db } from '../../app/firebase'; // Adjust path as needed
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Product } from 'types/products'; // Import Product interface

const productCollection = collection(db, 'products_sk');

const ProductService = {
    // Fetch all products from Firestore
    async getProducts(): Promise<Product[]> {
        const snapshot = await getDocs(productCollection);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
    },

    // Fetch a product by its name
    async getProductByName(productName: string): Promise<Product | null> {
        const productQuery = query(productCollection, where('product', '==', productName));
        const querySnapshot = await getDocs(productQuery);
        if (!querySnapshot.empty) {
            const productDoc = querySnapshot.docs[0];
            return { id: productDoc.id, ...productDoc.data() } as Product;
        }
        return null;
    },

    // Add a new product to Firestore
    async addProduct(product: Omit<Product, 'id'>): Promise<void> {
        try {
            await addDoc(productCollection, {
                ...product,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding product:', error);
        }
    },

    // Update an existing product in Firestore
    async updateProduct(id: string, updatedData: Partial<Product>): Promise<void> {
        try {
            const productDoc = doc(db, 'products_sk', id);
            await updateDoc(productDoc, {
                ...updatedData,
                updated_at: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating product:', error);
        }
    },

    // Delete a product from Firestore
    async deleteProduct(id: string): Promise<void> {
        try {
            const productDoc = doc(db, 'products_sk', id);
            await deleteDoc(productDoc);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    },
};

export default ProductService;
