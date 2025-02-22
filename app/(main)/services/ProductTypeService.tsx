//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/services/ProductTypeService.tsx

import { db } from "@/app/firebase"; // Ensure correct import
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { ProductType } from "@/types/products";

const productTypesRef = collection(db, "product_types");

// Fetch all product types
export const getProductTypes = async (): Promise<ProductType[]> => {
    const snapshot = await getDocs(productTypesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
};

// Add a new product type
export const addProductType = async (newType: Omit<ProductType, "id">) => {
    return await addDoc(productTypesRef, newType);
};

// Update an existing product type
export const updateProductType = async (id: string, updatedData: Partial<ProductType>) => {
    const typeDoc = doc(db, "product_types", id);
    return await updateDoc(typeDoc, updatedData);
};

// Delete a product type
export const deleteProductType = async (id: string) => {
    const typeDoc = doc(db, "product_types", id);
    return await deleteDoc(typeDoc);
};
