import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust the path if needed

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const db = admin.firestore();

// Function to set up AWD collections
const setupAwdCollections = async () => {
  try {
    console.log('🚀 Setting up AWD Firestore collections...');

    // Check if awd_inbound_shipments collection exists (dummy check)
    const shipmentRef = db.collection('awd_inbound_shipments');
    const existingShipment = await shipmentRef.limit(1).get();

    if (existingShipment.empty) {
      console.log('📦 Creating initial AWD inbound shipment structure...');
      await shipmentRef.doc('TestShipmentId').set({
        orderId: 'TestOrderId',
        shipmentStatus: 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        destinationAddress: {
          addressLine1: 'Sample Address',
          city: 'Sample City',
          stateOrRegion: 'Sample State',
          countryCode: 'US',
          postalCode: '12345',
        },
        originAddress: {
          addressLine1: 'Sample Origin',
          city: 'Sample City',
          stateOrRegion: 'Sample State',
          countryCode: 'US',
          postalCode: '12345',
        },
        shipmentSkuQuantities: [{
          sku: 'testSKU',
          expectedQuantity: { quantity: 10, unitOfMeasurement: 'CASE' },
          receivedQuantity: { quantity: 5, unitOfMeasurement: 'CASE' },
        }],
      });
      console.log('✅ AWD inbound shipments collection initialized.');
    } else {
      console.log('✅ AWD inbound shipments collection already exists. Skipping initialization.');
    }

    // Check if awd_inventory collection exists
    const inventoryRef = db.collection('awd_inventory');
    const existingInventory = await inventoryRef.limit(1).get();

    if (existingInventory.empty) {
      console.log('📦 Creating initial AWD inventory structure...');
      await inventoryRef.doc('testSKU').set({
        totalOnhandQuantity: 20,
        totalInboundQuantity: 10,
        inventoryDetails: {
          availableDistributableQuantity: 10,
          reservedDistributableQuantity: 5,
          replenishmentQuantity: 5,
        },
        expirationDetails: [{
          onhandQuantity: 10,
          expiration: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ AWD inventory collection initialized.');
    } else {
      console.log('✅ AWD inventory collection already exists. Skipping initialization.');
    }

    console.log('🎉 AWD Firestore setup complete!');
  } catch (error) {
    console.error('❌ Error setting up AWD collections:', error);
  }
};

// Run setup
setupAwdCollections();
