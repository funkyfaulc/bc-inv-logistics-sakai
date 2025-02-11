import admin from "firebase-admin";
import serviceAccount from "../keys/bc-inv-logistics-04377b7d2630.json"; // Adjust path if needed

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

const collections = [
  "inventory_summary",
  "awd_inventory",
  "fba_inventory",
  "inventory_production",
  "awd_inbound_shipments",
  "fba_shipments"
];

async function createCollections(): Promise<void> {
  for (const col of collections) {
    try {
      const docRef = db.collection(col).doc("init");
      await docRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      console.log(`✅ Collection '${col}' checked/created.`);
    } catch (error) {
      console.error(`❌ Error with collection '${col}':`, error);
    }
  }

  console.log("🔥 Firestore collections setup complete.");
  process.exit(0);
}

// Run the function
createCollections();