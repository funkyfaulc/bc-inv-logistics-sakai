// demo/services/OrderService.tsx

import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    serverTimestamp, 
    Timestamp, 
    getDoc 
} from 'firebase/firestore';
import { db } from '../../app/firebase';  // Adjust this path if necessary

// Import your custom interfaces from the centralized types
import { 
    Order, 
    Shipment, 
    ShipmentItem, 
    OrderFirestore, 
    ShipmentFirestore, 
    ShipmentItemFirestore 
} from 'types/orders';

// Firestore collection reference for orders
const orderCollection = collection(db, 'orders');


// Helper function to map Frontend Order to Firestore Order
// demo/services/OrderService.tsx

// Updated `mapFirestoreOrderToOrder`
const mapFirestoreOrderToOrder = (firestoreOrder: OrderFirestore, id: string): Order => {
    return {
        id,
        orderId: firestoreOrder.orderId,
        orderDate: firestoreOrder.orderDate ? firestoreOrder.orderDate.toDate() : null,
        finalCountDate: firestoreOrder.finalCountDate ? firestoreOrder.finalCountDate.toDate() : null,
        finishManufactureDate: firestoreOrder.finishManufactureDate ? firestoreOrder.finishManufactureDate.toDate() : null,
        leavePortDate: firestoreOrder.leavePortDate ? firestoreOrder.leavePortDate.toDate() : null,
        arrivePortDate: firestoreOrder.arrivePortDate ? firestoreOrder.arrivePortDate.toDate() : null,
        deliveredToAmazonDate: firestoreOrder.deliveredToAmazonDate ? firestoreOrder.deliveredToAmazonDate.toDate() : null,
        availableInAmazonDate: firestoreOrder.availableInAmazonDate ? firestoreOrder.availableInAmazonDate.toDate() : null,
        coverageDate: firestoreOrder.coverageDate ? firestoreOrder.coverageDate.toDate() : null,
        contract: firestoreOrder.contract || '',
        deposit: typeof firestoreOrder.deposit === 'number' ? firestoreOrder.deposit : parseFloat(firestoreOrder.deposit) || 0,
        totalCost: typeof firestoreOrder.totalCost === 'number' ? firestoreOrder.totalCost : parseFloat(firestoreOrder.totalCost) || 0,
        shipments: Array.isArray(firestoreOrder.shipments) ? firestoreOrder.shipments.map(shipment => ({
            shipmentId: shipment.shipmentId,
            destination: shipment.destination,
            cartons: shipment.cartons,
            cbm: shipment.cbm,
            weight: shipment.weight,
            amazonShipmentId: shipment.amazonShipmentId,
            amazonReference: shipment.amazonReference,
            giHbl: shipment.giHbl,
            giQuote: shipment.giQuote,
            insurance: shipment.insurance,
            items: shipment.items.map(item => ({
                sku: item.sku,
                unitCount: item.unitCount,
            })),
            boats: shipment.boats || '',
            departureDate: shipment.departureDate ? shipment.departureDate.toDate() : null,
            arrivalDate: shipment.arrivalDate ? shipment.arrivalDate.toDate() : null,
        })) : []
    };
};

// Updated `mapOrderToFirestore`
const mapOrderToFirestore = (order: Order): OrderFirestore => {
    return {
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
        deposit: order.deposit ?? 0,
        totalCost: order.totalCost ?? 0,
        created_at: serverTimestamp() as Timestamp,
        updated_at: serverTimestamp() as Timestamp,
        shipments: order.shipments ? order.shipments.map(shipment => ({
            shipmentId: shipment.shipmentId,
            destination: shipment.destination,
            cartons: shipment.cartons,
            cbm: shipment.cbm,
            weight: shipment.weight,
            amazonShipmentId: shipment.amazonShipmentId,
            amazonReference: shipment.amazonReference,
            giHbl: shipment.giHbl,
            giQuote: shipment.giQuote,
            insurance: shipment.insurance,
            items: shipment.items.map(item => ({
                sku: item.sku,
                unitCount: item.unitCount
            })),
            boats: shipment.boats || '',
            departureDate: shipment.departureDate ? Timestamp.fromDate(shipment.departureDate) : null,
            arrivalDate: shipment.arrivalDate ? Timestamp.fromDate(shipment.arrivalDate) : null,
        })) : []
    };
};


export const OrderService = {
    // Fetch all orders from Firestore and convert Timestamps to JavaScript Date objects
    async getOrders(): Promise<Order[]> {
        const snapshot = await getDocs(orderCollection);
        return snapshot.docs.map(doc => {
            const data = doc.data() as OrderFirestore; // Type assertion
            return mapFirestoreOrderToOrder(data, doc.id);
        });
    },

    // Add a new order to Firestore
    async addOrder(order: Order): Promise<void> {
        try {
            console.log("Attempting to add order:", order);

            // Check for duplicate orderId
            const existingOrdersSnapshot = await getDocs(orderCollection);
            const existingOrderIds = existingOrdersSnapshot.docs.map(doc => doc.data().orderId);

            if (existingOrderIds.includes(order.orderId)) {
                throw new Error(`Order with orderId: ${order.orderId} already exists.`);
            }

            // Remove the 'id' field from the order object before adding to Firestore
            const { id, ...orderDataWithoutId } = order;
            
            const firestoreOrder = mapOrderToFirestore(orderDataWithoutId);

            await addDoc(orderCollection, firestoreOrder);
            console.log("Order added successfully!");
        } catch (error) {
            console.error('Error adding order:', error);
        }
    },

    // Update an existing order in Firestore
    async updateOrder(orderId: string, updatedOrder: Order): Promise<void> {
        try {
            const orderDoc = doc(db, 'orders', orderId);

            // Remove the 'id' field from the updated order before sending to Firestore
            const { id, ...updatedOrderWithoutId } = updatedOrder;

            // Convert to Firestore data
            const firestoreOrder = mapOrderToFirestore(updatedOrderWithoutId);

            // Log the data being sent to Firestore
            console.log("Updating Firestore with order:", firestoreOrder);

            await updateDoc(orderDoc, firestoreOrder);

            // Log the updated shipments
            console.log("Updated order in Firestore:", firestoreOrder);

            console.log("Order updated successfully!");
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

    // Fetch an order by ID
    async getOrderById(orderId: string): Promise<Order | null> {
        try {
            const orderDoc = doc(db, 'orders', orderId);
            const docSnap = await getDoc(orderDoc);
            if (docSnap.exists()) {
                const data = docSnap.data() as OrderFirestore; // Type assertion
                return mapFirestoreOrderToOrder(data, docSnap.id);
            } else {
                console.warn(`Order with ID ${orderId} does not exist.`);
                return null;
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }
};