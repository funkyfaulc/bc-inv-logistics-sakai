import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust if needed

// ✅ Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
}

const db = getFirestore();

// ✅ Function to Migrate Inventory Production into Order Subcollections
const migrateOrdersToSubcollections = async () => {
    console.log("🚀 Starting migration of inventory_production into orders/{orderId}/products/{asin}...");

    const inventoryRef = db.collection("inventory_production");
    const snapshot = await inventoryRef.get();

    if (snapshot.empty) {
        console.log("⚠️ No inventory production data found.");
        return;
    }

    const batch = db.batch();

    snapshot.forEach((doc) => {
        const data = doc.data();
        const { asin, sku, orderId, totalUnitCount, totalCartonCount } = data;

        if (!asin || !orderId) {
            console.warn(`❌ Skipping doc ${doc.id} due to missing ASIN or orderId`);
            return;
        }

        // ✅ New Document Path: orders/{orderId}/products/{asin}
        const newDocRef = db
            .collection("orders")
            .doc(orderId)
            .collection("products")
            .doc(asin);

        batch.set(newDocRef, {
            sku: sku || "UNKNOWN_SKU",
            totalUnitCount: totalUnitCount ?? 0,
            totalCartonCount: totalCartonCount ?? 0,
            migratedAt: admin.firestore.Timestamp.now(),
        });
    });

    await batch.commit();
    console.log("✅ Migration completed successfully!");
};

// 🚀 Run Migration
migrateOrdersToSubcollections()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("🔥 Migration failed:", error);
        process.exit(1);
    });