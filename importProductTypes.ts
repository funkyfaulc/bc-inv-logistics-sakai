import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load the service account key
import serviceAccount from './keys/bc-inv-logistics-04377b7d2630.json'; // Adjust if necessary

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

// Firestore database reference
const db = admin.firestore();

// Your Firestore import logic
(async () => {
  try {
    // Load the product types JSON file
    const jsonFilePath = path.resolve(__dirname, 'backup', 'productTypes.json');
    const productTypes = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    const batch = db.batch();
    productTypes.forEach((type: any) => {
      console.log(`Adding product type: ${type.product}`);
      const docRef = db.collection('product_types').doc(type.product);
      batch.set(docRef, type);
    });

    await batch.commit();
    console.log('Product types imported successfully!');
  } catch (error) {
    console.error('Error importing product types:', error);
  }
})();
