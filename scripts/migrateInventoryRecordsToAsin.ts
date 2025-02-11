import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust the path if needed

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

const migrateInventoryRecords = async () => {
  try {
    console.log('🚀 Starting migration of inventory_records to ASIN-based structure...');

    const inventoryRef = db.collection('inventory_records');
    const snapshot = await inventoryRef.get();

    if (snapshot.empty) {
      console.log('❌ No inventory records found.');
      return;
    }

    const batch = db.batch();
    let processedCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const { asin, sku, fba, inbound_to_fba, reserved_units, reserved_fc_transfer, reserved_fc_processing, reserved_customer_order, awd, inbound_to_awd, snapshotDate, createdAt, updatedAt } = data;

      if (!asin) {
        console.warn(`⚠️ Skipping doc ${doc.id} due to missing ASIN`);
        return;
      }

      // New doc reference using ASIN as the key
      const newDocRef = db.collection('inventory_records').doc(asin);

      batch.set(newDocRef, {
        asin,
        sku: sku || "Unknown SKU",
        totalAvailable: fba ?? 0,
        inbound_to_fba: inbound_to_fba ?? 0,
        reserved_units: reserved_units ?? 0,
        reserved_fc_transfer: reserved_fc_transfer ?? 0,
        reserved_fc_processing: reserved_fc_processing ?? 0,
        reserved_customer_order: reserved_customer_order ?? 0,
        totalAWD: awd ?? 0,
        inbound_to_awd: inbound_to_awd ?? 0,
        snapshotDate: snapshotDate || new Date(),
        createdAt: createdAt || new Date(),
        updatedAt: updatedAt || new Date(),
      }, { merge: true });

      processedCount++;
    });

    await batch.commit();
    console.log(`✅ Migration completed successfully! Processed ${processedCount} records.`);
  } catch (error) {
    console.error('❌ Error migrating inventory records:', error);
  }
};

// Run the migration
migrateInventoryRecords();
