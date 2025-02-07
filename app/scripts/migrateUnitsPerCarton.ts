import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Load the service account key
import serviceAccount from '../../keys/bc-inv-logistics-04377b7d2630.json'; // Ensure this exists

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
}

// Firestore database reference
const db = admin.firestore();

const getUnitsPerCarton = (product: string, material?: string, size?: string): number => {
  switch (product) {
    case 'Bed Sheets':
      return size === 'Twin' || size === 'TwinXL' ? 8 : 6;
    case 'Crib Sheet':
      return 40;
    case 'Duvet Cover':
      return 6;
    case 'Fitted Sheet':
      return 12;
    case 'Flat Sheet':
      return 12;
    case 'Pillowcase':
      return material === 'Bamboo' ? 40 : material === 'Silk' ? 50 : 0;
    default:
      return 0;
  }
};

const migrateUnitsPerCarton = async () => {
  try {
    console.log('🚀 Starting unitsPerCarton migration...');
    const productsCollection = db.collection('products_sk');
    const snapshot = await productsCollection.get();

    if (snapshot.empty) {
      console.log("❌ No products found in 'products_sk' collection.");
      return;
    }

    console.log(`🔍 Found ${snapshot.size} products. Processing updates...`);

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const productData = doc.data();
      const { product, material, size } = productData;

      const unitsPerCarton = getUnitsPerCarton(product, material, size);

      if (unitsPerCarton > 0) {
        console.log(`✅ Updating ${productData.sku} → ${unitsPerCarton} units per carton.`);
        const productRef = productsCollection.doc(doc.id);
        batch.update(productRef, { unitsPerCarton });
      } else {
        console.warn(`⚠️ No match for ${product} (Material: ${material}, Size: ${size})`);
      }
    });

    await batch.commit();
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error updating products:', error);
  }
};

// Run the migration
migrateUnitsPerCarton();