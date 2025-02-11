import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust the path if needed

// Initialize Firebase Admin SDK (ensure it only initializes once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

// Firestore database reference
const db = admin.firestore();

(async () => {
  try {
    console.log("🛠 Checking Firestore Data...");

    // Fetch inventory_production documents
    const snapshot = await db.collection("inventory_production").get();
    if (snapshot.empty) {
      console.log("⚠️ No documents found in inventory_production.");
    } else {
      console.log(`✅ Found ${snapshot.size} documents.`);
      snapshot.docs.forEach(doc => console.log(`- ${doc.id}:`, doc.data()));
    }

  } catch (error) {
    console.error("🔥 Error fetching Firestore data:", error);
  }
})();