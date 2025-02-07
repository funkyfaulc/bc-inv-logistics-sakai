import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const forecastInventory = functions.pubsub.schedule("every 24 hours").onRun(async (context: functions.EventContext) => {
    try {
        const salesRef = db.collection("sales_history");
        const forecastRef = db.collection("forecasted_inventory");

        const salesSnapshot = await salesRef.orderBy("date", "desc").limit(30).get();
        if (salesSnapshot.empty) {
            console.log("No sales data available.");
            return null;
        }

        const salesData: Record<string, { totalSales: number; days: number; currentStock: number }> = {};

        salesSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
            const data = doc.data();
            if (!salesData[data.asin]) {
                salesData[data.asin] = { totalSales: 0, days: 0, currentStock: data.current_stock };
            }
            salesData[data.asin].totalSales += data.units_sold;
            salesData[data.asin].days += 1;
        });

        for (const asin in salesData) {
            if (!salesData[asin]) continue;  // Ensure valid data exists
            const { totalSales, days, currentStock } = salesData[asin];
            const dailySalesVelocity = totalSales / days;
            const stockoutDays = currentStock / (dailySalesVelocity || 1);
            const recommendedRestock = dailySalesVelocity * 30;

            await forecastRef.doc(asin).set({
                asin,
                forecasted_demand: recommendedRestock,
                stockout_date: new Date(Date.now() + stockoutDays * 24 * 60 * 60 * 1000).toISOString(),
                recommended_restock: Math.ceil(recommendedRestock),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        console.log("Inventory forecasting completed successfully.");
        return null;
    } catch (error) {
        console.error("Error in inventory forecasting: ", error);
        return null;
    }
});