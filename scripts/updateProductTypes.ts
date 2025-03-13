import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import serviceAccount from "../keys/bc-inv-logistics-04377b7d2630.json"; // ✅ Ensure correct path

// ✅ Initialize Firebase Admin SDK (Backend)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
}

const db = admin.firestore();
const PRODUCT_TYPES_COLLECTION = "product_types";

// ✅ Define meters per unit for each product type and size
const metersMapping: Record<string, Record<string, number>> = {
    "Bed Sheets": {
        "Cal King": 8,
        "Full": 6.2,
        "King": 7.78,
        "Queen": 6.67,
        "Split King": 9.09,
        "Split Top King": 8.09,
        "Twin XL": 5.1,
        "Twin": 4.9
    },
    "Crib Sheet": {
        "Crib": 1
    },
    "Duvet Cover": {
        "Cal King": 7.76,
        "King": 7.76,
        "Queen": 6.6
    },
    "Flat Sheet": {
        "Cal King": 3.5,
        "King": 3,
        "Queen": 2.57
    },
    "Fitted Sheet": {
        "Cal King": 3.5,
        "King": 3.06,
        "Queen": 2.6
    },
    "Pillowcase": {
        "King": 0.98,
        "Queen": 0.8,
        "Standard": 0.72
    }
};

// ✅ Fix Firestore
const restoreProductTypes = async () => {
    try {
        const querySnapshot = await db.collection(PRODUCT_TYPES_COLLECTION).get();

        for (const docSnap of querySnapshot.docs) {
            const productData = docSnap.data();
            const productType = productData.product; // Get document title

            if (!metersMapping[productType]) {
                console.log(`⚠️ No meters data found for: ${productType}`);
                continue;
            }

            // ✅ Restore `validSizes` from the original data
            let updatedData: any = { ...productData };

            if (!Array.isArray(updatedData.validSizes)) {
                console.warn(`⚠️ Missing validSizes for ${productType}. Restoring from Firestore.`);
                updatedData.validSizes = productData.validSizes || [];
            }

            // ✅ Map meters per size without overriding validSizes
            updatedData.metersPerSize = metersMapping[productType];

            // ✅ Remove unwanted fields
            delete updatedData.product; // Product name is already the document ID

            // ✅ Remove broken size entries
            updatedData.validSizes = updatedData.validSizes.filter((size: any) => typeof size === "string");

            // ✅ Update Firestore document
            await db.collection(PRODUCT_TYPES_COLLECTION).doc(docSnap.id).set(updatedData, { merge: true });
            console.log(`✅ Fixed ${productType}`);
        }

        console.log("🎉 Product types fully restored!");
    } catch (error) {
        console.error("🔥 Error restoring product types:", error);
    }
};

// ✅ Run the restore function
restoreProductTypes();
