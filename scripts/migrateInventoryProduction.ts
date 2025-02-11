import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust if needed

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

const migrateInventoryProduction = async () => {
  try {
    console.log('🚀 Starting migration of inventory_production to ASIN structure...');

    const inventoryRef = db.collection('inventory_production');
    const snapshot = await inventoryRef.get();

    if (snapshot.empty) {
      console.log('❌ No inventory production data found.');
      return;
    }

    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const { asin, sku, orderId, totalUnitCount, totalCartonCount } = data;

      if (!asin || !sku || !orderId) {
        console.warn(`⚠️ Skipping doc ${doc.id} due to missing ASIN, SKU, or orderId`);
        return;
      }

      // Define the new document path: inventory_production/{ASIN}/orders/{orderId}
      const newDocRef = db
        .collection('inventory_production')
        .doc(asin) // ASIN as document ID
        .collection('orders')
        .doc(orderId); // Order ID as subdocument

      batch.set(newDocRef, {
        sku,
        totalUnitCount: totalUnitCount ?? 0,
        totalCartonCount: totalCartonCount ?? 0,
      });
    });

    await batch.commit();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error migrating inventory production:', error);
  }
};

// Run the migration
migrateInventoryProduction();