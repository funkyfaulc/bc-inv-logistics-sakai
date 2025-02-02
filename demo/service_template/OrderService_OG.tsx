//Old Version of OrderService.tsx Commenting out before build 12132024
/*

import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../../app/firebase'; // Adjust this path to your Firebase config

// Define the order interface
interface Order {
    id?: string;
    orderId: string;
    orderDate: Date | null;
    finalCountDate: Date | null;
    finishManufactureDate: Date | null;
    leavePortDate: Date | null;
    arrivePortDate: Date | null;
    deliveredToAmazonDate: Date | null;
    availableInAmazonDate: Date | null;
    coverageDate: Date | null;
    contract?: string;
    deposit?: number;
    totalCost?: number;
    created_at?: any;
    updated_at?: any;
    shipments?: Shipment[];
}

//New ShipmentItem Interface
interface ShipmentItem {
    sku: string; //reference SKU from products collection
    unitcount: number; //number of units for this sku
}

// Firestore collection reference for orders
const orderCollection = collection(db, 'orders');

export const OrderService = {
    // Fetch all orders from Firestore and convert Timestamps to JavaScript Date objects
    async getOrders(): Promise<Order[]> {
        const snapshot = await getDocs(orderCollection);
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id, // Only for frontend reference, not persisted
                orderDate: data.orderDate ? data.orderDate.toDate() : null,
                finalCountDate: data.finalCountDate ? data.finalCountDate.toDate() : null,
                finishManufactureDate: data.finishManufactureDate ? data.finishManufactureDate.toDate() : null,
                leavePortDate: data.leavePortDate ? data.leavePortDate.toDate() : null,
                arrivePortDate: data.arrivePortDate ? data.arrivePortDate.toDate() : null,
                deliveredToAmazonDate: data.deliveredToAmazonDate ? data.deliveredToAmazonDate.toDate() : null,
                availableInAmazonDate: data.availableInAmazonDate ? data.availableInAmazonDate.toDate() : null,
                coverageDate: data.coverageDate ? data.coverageDate.toDate() : null
            };
        });
    },

    // Add a new order to Firestore
    async addOrder(order: Order): Promise<void> {
        try {
            console.log('Attempting to add order:', order);

            // Check for duplicate orderId
            const existingOrdersSnapshot = await getDocs(orderCollection);
            const existingOrderIds = existingOrdersSnapshot.docs.map((doc) => doc.data().orderId);

            if (existingOrderIds.includes(order.orderId)) {
                throw new Error(`Order with orderId: ${order.orderId} already exists.`);
            }

            // Remove the 'id' field from the order object before adding to Firestore
            const { id, ...orderDataWithoutId } = order;

            await addDoc(orderCollection, {
                ...orderDataWithoutId,
                orderId: order.orderId,
                orderDate: order.orderDate ? Timestamp.fromDate(order.orderDate) : null,
                finalCountDate: order.finalCountDate ? Timestamp.fromDate(order.finalCountDate) : null,
                finishManufactureDate: order.finishManufactureDate ? Timestamp.fromDate(order.finishManufactureDate) : null,
                leavePortDate: order.leavePortDate ? Timestamp.fromDate(order.leavePortDate) : null,
                arrivePortDate: order.arrivePortDate ? Timestamp.fromDate(order.arrivePortDate) : null,
                deliveredToAmazonDate: order.deliveredToAmazonDate ? Timestamp.fromDate(order.deliveredToAmazonDate) : null,
                availableInAmazonDate: order.availableInAmazonDate ? Timestamp.fromDate(order.availableInAmazonDate) : null,
                coverageDate: order.coverageDate ? Timestamp.fromDate(order.coverageDate) : null,
                contract: order.contract || '',
                deposit: order.deposit || 0,
                totalCost: order.totalCost || 0,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });
            console.log('Order added successfully!');
        } catch (error) {
            console.error('Error adding order:', error);
        }
    },

    // Update an existing order in Firestore
    async updateOrder(orderId: string, updatedOrder: Order): Promise<void> {
        try {
            const orderDoc = doc(db, 'orders', orderId);

            // Ensure Shipments is properly structured before sending to Firestore
            const updatedShipments = updatedOrder.shipments
                ? updatedOrder.shipments.map((shipment) => ({
                      shipmentId: shipment.shipmentId || '',
                      destination: shipment.destination || '',
                      cartons: shipment.cartons || 0,
                      cbm: shipment.cbm || 0,
                      weight: shipment.weight || 0,
                      amazonShipmentId: shipment.amazonShipmentId || '',
                      amazonReference: shipment.amazonReference || '',
                      giHbl: shipment.giHbl || '',
                      giQuote: shipment.giQuote || '',
                      insurance: shipment.insurance || 0
                  }))
                : [];

            // Remove the 'id' field from the updated order before sending to Firestore
            const { id, ...updatedOrderWithoutId } = updatedOrder;

            // Log the data being sent to Firestore
            console.log('Updating Firestore with order:', {
                ...updatedOrderWithoutId,
                shipments: updatedShipments
            });

            await updateDoc(orderDoc, {
                ...updatedOrderWithoutId,
                orderId: updatedOrder.orderId,
                orderDate: updatedOrder.orderDate ? Timestamp.fromDate(updatedOrder.orderDate) : null,
                finalCountDate: updatedOrder.finalCountDate ? Timestamp.fromDate(updatedOrder.finalCountDate) : null,
                finishManufactureDate: updatedOrder.finishManufactureDate ? Timestamp.fromDate(updatedOrder.finishManufactureDate) : null,
                leavePortDate: updatedOrder.leavePortDate ? Timestamp.fromDate(updatedOrder.leavePortDate) : null,
                arrivePortDate: updatedOrder.arrivePortDate ? Timestamp.fromDate(updatedOrder.arrivePortDate) : null,
                deliveredToAmazonDate: updatedOrder.deliveredToAmazonDate ? Timestamp.fromDate(updatedOrder.deliveredToAmazonDate) : null,
                availableInAmazonDate: updatedOrder.availableInAmazonDate ? Timestamp.fromDate(updatedOrder.availableInAmazonDate) : null,
                coverageDate: updatedOrder.coverageDate ? Timestamp.fromDate(updatedOrder.coverageDate) : null,
                shipments: updatedShipments, // Handle shipments array
                contract: updatedOrder.contract || '',
                deposit: updatedOrder.deposit || 0,
                totalCost: updatedOrder.totalCost || 0,
                updated_at: serverTimestamp()
            });

            // Add this log to confirm the shipments data is being passed to Firestore
            console.log('Updated shipments in Firestore:', updatedShipments);

            console.log('Order updated successfully!');
        } catch (error) {
            console.error('Error updating order:', error);
        }
    },

    // Delete an order from Firestore
    async deleteOrder(orderId: string): Promise<void> {
        try {
            const orderDoc = doc(db, 'orders', orderId);
            await deleteDoc(orderDoc);
            console.log(`Deleted order with ID: ${orderId}`);
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    },

    // Get an order by ID
    async getOrderById(orderId: string): Promise<Order | null> {
        try {
            const orderDoc = doc(db, 'orders', orderId);
            const docSnap = await getDoc(orderDoc);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    ...data,
                    id: docSnap.id,
                    orderDate: data.orderDate ? data.orderDate.toDate() : null,
                    finalCountDate: data.finalCountDate ? data.finalCountDate.toDate() : null,
                    finishManufactureDate: data.finishManufactureDate ? data.finishManufactureDate.toDate() : null,
                    leavePortDate: data.leavePortDate ? data.leavePortDate.toDate() : null,
                    arrivePortDate: data.arrivePortDate ? data.arrivePortDate.toDate() : null,
                    deliveredToAmazonDate: data.deliveredToAmazonDate ? data.deliveredToAmazonDate.toDate() : null,
                    availableInAmazonDate: data.availableInAmazonDate ? data.availableInAmazonDate.toDate() : null,
                    coverageDate: data.coverageDate ? data.coverageDate.toDate() : null,
                    shipments: data.shipments || [] //Ensure shipments is an array
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }
};
*/