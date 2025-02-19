import { db } from "@firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { OrderItemFirestore, OrderItem, Order } from "@/types/orders";
import { writeBatch, doc, Timestamp } from "firebase/firestore";

// ✅ Firestore References
const inventoryProductionRef = collection(db, "inventory_production");
const productsCollectionRef = collection(db, "products_sk");
const ordersCollectionRef = collection(db, "orders");

// ✅ Function: Fetch Inventory Production Data
export const fetchInventoryProduction = async (orderId: string): Promise<OrderItem[]> => {
    try {
        if (!orderId) {
            console.error("❌ fetchInventoryProduction called with missing orderId");
            return [];
        }

        console.log(`📌 Fetching production data for Order: ${orderId}`);

        // 🔹 Fetch existing production data from `inventory_production/{orderId}/products`
        const productionQuery = collection(db, "inventory_production", orderId, "products");
        const productionSnapshot = await getDocs(productionQuery);

        let existingProductionMap: Record<string, OrderItemFirestore> = {};
        productionSnapshot.docs.forEach(doc => {
            const data = doc.data();
            existingProductionMap[doc.id] = {
                asin: doc.id,
                sku: data.sku || "MISSING_SKU",
                totalUnitCount: data.totalUnitCount ?? 0,
                totalCartonCount: data.totalCartonCount ?? 0,
                unitsPerCarton: data.unitsPerCarton ?? 1,
                orderId, // ✅ FIX: Ensure orderId is always included
            };
        });

        console.log(`✅ Firestore returned ${Object.keys(existingProductionMap).length} ASINs for order: ${orderId}`);
        console.log("🔥 Raw Firestore Data:", productionSnapshot.docs.map(doc => doc.data()));

        // 🔹 Fetch ALL available products from `products_sk`
        const productsSnapshot = await getDocs(collection(db, "products_sk"));
        let allProducts: Record<string, OrderItem> = {};

        productsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const asin = data.asin || `UNKNOWN_ASIN_${doc.id}`; // ✅ Ensure ASIN exists
            allProducts[asin] = {
                id: asin,
                asin,
                sku: data.sku || "UNKNOWN_SKU",
                product: data.product || "Unknown Product", // ✅ Ensure product names exist
                unitsPerCarton: data.unitsPerCarton || 1,
                totalUnitCount: 0, // Default to 0, updated if found in existing production
                totalCartonCount: 0,
            };
        });

        console.log(`📌 Available products from products_sk: ${Object.keys(allProducts).length}`);

        // 🔹 Merge production data with available products
        const mergedProducts: OrderItem[] = Object.keys(allProducts).map((asin) => ({
            id: asin,
            asin,
            sku: existingProductionMap[asin]?.sku ?? allProducts[asin]?.sku ?? "UNKNOWN_SKU",
            product: allProducts[asin]?.product ?? "Unknown Product",  // ✅ Ensure product names are included
            totalUnitCount: existingProductionMap[asin]?.totalUnitCount ?? 0,
            totalCartonCount: existingProductionMap[asin]?.totalCartonCount ?? 0,
            unitsPerCarton: existingProductionMap[asin]?.unitsPerCarton ?? allProducts[asin]?.unitsPerCarton ?? 1,
        }));

        console.log(`✅ Final Merged Products List for ${orderId}:`, mergedProducts);
        return mergedProducts;
    } catch (error) {
        console.error("🔥 Error fetching production data:", error);
        return [];
    }
};

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
        if (!item.asin || !item.orderId) {
            console.error("❌ Missing ASIN or OrderId for item:", item);
            return;
        }

        const orderRef = doc(db, "inventory_production", item.orderId); // ✅ Save under OrderId
        const productRef = doc(orderRef, "products", item.asin); // ✅ Store products inside orderId

        batch.set(productRef, {
            sku: item.sku,
            totalUnitCount: item.totalUnitCount,
            totalCartonCount: item.totalCartonCount,
            unitsPerCarton: item.unitsPerCarton,
            updatedAt: Timestamp.now(),
        }, { merge: true });
    });

    await batch.commit();
    console.log("✅ Inventory production data saved!");
};

