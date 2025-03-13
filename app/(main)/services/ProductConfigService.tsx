import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
const CONFIG_COLLECTION = "product_config";

export const fetchProductConfigs = async () => {
    const querySnapshot = await getDocs(collection(db, CONFIG_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveProductConfig = async (config: any) => {
    const docRef = doc(db, CONFIG_COLLECTION, config.id || new Date().getTime().toString());
    return setDoc(docRef, config, { merge: true });
};

export const deleteProductConfig = async (id: string) => {
    return deleteDoc(doc(db, CONFIG_COLLECTION, id));
};
