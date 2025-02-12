import admin from "firebase-admin";
import serviceAccount from "../keys/bc-inv-logistics-04377b7d2630.json"; // Adjust if needed

// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

// ✅ Ensure `sales_velocity` collection exists
async function setupSalesVelocityCollection(): Promise<void> {
  try {
    const testAsin = "TEST_ASIN_123"; // Placeholder test ASIN
    const testDocRef = db.collection("sales_velocity").doc(testAsin);

    await testDocRef.set(
      {
        asin: testAsin,
        sku: "TEST_SKU",
        salesVelocity: 0,
        snapshotDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ `sales_velocity` collection initialized successfully!");
  } catch (error) {
    console.error("❌ Error setting up `sales_velocity` collection:", error);
  } finally {
    process.exit(0); // Exit the script after execution
  }
}

// Run the function
setupSalesVelocityCollection();
