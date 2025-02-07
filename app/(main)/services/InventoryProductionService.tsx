import { db } from "@firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { OrderItemFirestore, OrderItem, Order } from "@/types/orders";
import { writeBatch, doc, Timestamp } from "firebase/firestore";

// ✅ Firestore References
const inventoryProductionRef = collection(db, "inventory_production");
const productsCollectionRef = collection(db, "products_sk");
const ordersCollectionRef = collection(db, "orders");

// ✅ Function: Get Active Orders
export const getActiveOrders = async (): Promise<Order[]> => {
    const q = query(ordersCollectionRef, where("orderStatus", "!=", "Completed"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        orderId: doc.data().orderId || "Unknown Order ID",
        orderStatus: doc.data().orderStatus || "Processing",
    }));
};

// ✅ Function: Get Products for an Order (Including ALL SKUs)
export const getOrderProducts = async (orderId: string): Promise<OrderItem[]> => {
    console.log(`🛠 Fetching products for order ID: ${orderId}`);

    // Step 1: Get all products from Firestore
    const productSnapshot = await getDocs(productsCollectionRef);
    const allProducts = productSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            asin: data.asin || `MISSING_ASIN_${doc.id}`, // ✅ Use fallback if missing
            sku: data.sku as string,
            product: data.product || "Unknown Product",
            unitsPerCarton: data.unitsPerCarton || 0,
            totalUnitCount: 0,
            totalCartonCount: 0,
            id: doc.id,
        };
    });
    console.log("🛠 All Products Fetched:", allProducts);

    // Step 2: Get products for the selected order
    const q = query(ordersCollectionRef, where("orderId", "==", orderId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.warn(`⚠️ No order found with ID: ${orderId}`);
        return allProducts;
    }

    const orderData = snapshot.docs[0].data();
    console.log(`🛠 Order Data Fetched:`, orderData);

    const orderedProducts: OrderItem[] = orderData.shipments?.flatMap((shipment: { items: OrderItem[] }) => shipment.items) ?? [];

    console.log(`🛠 Ordered Products in Firestore Order:`, orderedProducts);

    // Step 3: Merge ordered products with all products to ensure all SKUs are listed
    const mergedProducts = allProducts.map(product => {
        const existingProduct = orderedProducts.find((p: OrderItem) => p.sku === product.sku);
        return {
            ...product,
            totalUnitCount: existingProduct?.totalUnitCount || 0,
            totalCartonCount: existingProduct?.totalCartonCount || 0,
        };
    });

    console.log(`🛠 Final Merged Products List:`, mergedProducts);

    return mergedProducts;
};


// ✅ Function: Save Production Data to Firestore
export const saveInventoryProduction = async (productionData: OrderItemFirestore[]) => {
    const batch = writeBatch(db);

    productionData.forEach((item) => {
        if (!item.asin) {
            console.error("❌ Missing ASIN for item:", item);
            return; 
        }

        const docRef = doc(inventoryProductionRef, item.asin); // ✅ Store by ASIN instead of SKU

        batch.set(docRef, {
            ...item,
            sku: item.sku, // ✅ Keep SKU for reference
            updatedAt: Timestamp.now(),
        }, { merge: true });
    });

    await batch.commit();
    console.log("✅ Inventory production data saved!");
};