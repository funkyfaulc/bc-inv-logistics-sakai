import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../keys/bc-inv-logistics-04377b7d2630.json'; // Adjust if needed

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

const db = admin.firestore();

const setupInventoryCollections = async () => {
  try {
    console.log('🚀 Setting up AWD and FBA inventory collections...');

    // 🔹 AWD Inventory Collection
    const awdInventoryRef = db.collection('awd_inventory').doc('SampleSKU');
    await awdInventoryRef.set({
      sku: 'SampleSKU',
      totalOnhandQuantity: 50,
      totalInboundQuantity: 20,
      inventoryDetails: {
        availableDistributableQuantity: 30,
        reservedDistributableQuantity: 10,
        replenishmentQuantity: 5,
      },
      expirationDetails: [
        { onhandQuantity: 20, expiration: '2027-01-12T10:00:00.000Z' },
      ],
    });

    // 🔹 AWD Inbound Shipments
    const awdInboundShipmentRef = db.collection('awd_inbound_shipments').doc('TestShipmentId');
    await awdInboundShipmentRef.set({
      shipmentId: 'TestShipmentId',
      orderId: 'TestOrder123',
      createdAt: new Date().toISOString(),
      shipmentStatus: 'CREATED',
      originAddress: {
        name: 'Supplier Warehouse',
        city: 'Los Angeles',
        countryCode: 'US',
      },
      destinationAddress: {
        name: 'Amazon AWD',
        city: 'Phoenix',
        countryCode: 'US',
      },
      shipmentSkuQuantities: [
        {
          sku: 'SampleSKU',
          expectedQuantity: { quantity: 10, unitOfMeasurement: 'CASES' },
          receivedQuantity: { quantity: 5, unitOfMeasurement: 'CASES' },
        },
      ],
    });

    // 🔹 FBA Inventory Collection
    const fbaInventoryRef = db.collection('fba_inventory').doc('SampleSKU');
    await fbaInventoryRef.set({
      sku: 'SampleSKU',
      available: 100,
      inbound: 25,
      reserved_fc_transfer: 10,
      reserved_fc_processing: 5,
      reserved_customer_orders: 15,
    });

    // 🔹 FBA Shipments
    const fbaShipmentRef = db.collection('fba_shipments').doc('FBA_Shipment123');
    await fbaShipmentRef.set({
      shipmentId: 'FBA_Shipment123',
      awdShipmentId: 'TestShipmentId',
      createdAt: new Date().toISOString(),
      shipmentStatus: 'SHIPPED',
      destinationFulfillmentCenter: 'PHX3',
      trackingId: 'TRACK123456',
      estimatedDeliveryDate: '2025-06-20T00:00:00.000Z',
    });

    console.log('✅ AWD & FBA inventory collections set up successfully!');
  } catch (error) {
    console.error('❌ Error setting up inventory collections:', error);
  }
};

// Run setup
setupInventoryCollections();