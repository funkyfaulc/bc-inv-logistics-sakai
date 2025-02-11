import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Load the service account key
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Ensure this file exists!

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
}

// Firestore database reference
const db = admin.firestore();

const updateProducts = async () => {
    try {
        const productsCollection = db.collection('products_sk');
        const snapshot = await productsCollection.get();

        if (snapshot.empty) {
            console.log("No products found in 'products_sk' collection.");
            return;
        }

        console.log(`Found ${snapshot.size} products. Updating...`);

        const batch = db.batch();

        snapshot.docs.forEach((doc) => {
            const productData = doc.data();

            // Add unitsPerCarton with a default value of 0 if it doesn't exist
            if (!productData.unitsPerCarton) {
                const productRef = productsCollection.doc(doc.id);
                batch.update(productRef, { unitsPerCarton: 6 });
                console.log(`Updated ${doc.id} - Added unitsPerCarton`);
            }
        });

        await batch.commit();
        console.log('✅ Products updated successfully!');
    } catch (error) {
        console.error('❌ Error updating products:', error);
    }
};

// Run the update function
updateProducts();