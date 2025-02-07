import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust path if needed

// ✅ Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

// Firestore database reference
const db = admin.firestore();

const clearInventoryProduction = async () => {
  try {
    console.log("🛠 Fetching `inventory_production` documents...");
    const snapshot = await db.collection("inventory_production").get();
    
    if (snapshot.empty) {
      console.log("⚠️ No documents found in `inventory_production`.");
      return;
    }

    console.log(`✅ Found ${snapshot.size} documents. Deleting...`);
    
    const batchSize = 500;
    let batchCount = 0;
    let batch = db.batch();

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;

      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`✅ Deleted ${batchSize} documents, processing next batch...`);
        
        // 🔹 Reset batch & batchCount after commit
        batch = db.batch();
        batchCount = 0;
      }
    }

    // 🔹 Commit any remaining deletions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Final batch committed. Deleted remaining ${batchCount} documents.`);
    }

    console.log("✅ `inventory_production` wiped clean!");

  } catch (error) {
    console.error("🔥 Error deleting Firestore data:", error);
  }
};

// Run the cleanup
clearInventoryProduction();