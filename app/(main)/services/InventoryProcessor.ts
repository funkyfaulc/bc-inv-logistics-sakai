import { db } from "@firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import Papa from "papaparse";
import { InventoryUpdate } from "@/types/inventory";

const FBA_COLUMN_MAP = {
    asin: 3, sku: 1, availableUnits: 6, inboundToFba: 52,
    reservedUnits: 57, reservedFcTransfer: 85, reservedFcProcessing: 86, reservedCustomerOrder: 87,
};

const AWD_COLUMN_MAP = {
    asin: 3, sku: 1, inboundToAwd: 4, awdAvailable: 6, outboundToFba: 15,
};

export const InventoryProcessor = {
    async processFiles(fbaFile?: File, awdFile?: File) {
        const fbaData = fbaFile ? await this.parseCsv(fbaFile, 1) : [];
        const awdData = awdFile ? await this.parseCsv(awdFile, 3) : []; // ✅ Skip first 2 rows in AWD
        const records: InventoryUpdate[] = [];

        // Process FBA Data
        fbaData.forEach(row => {
            const asin = row[FBA_COLUMN_MAP.asin]?.trim();
            if (!asin) return;

            records.push({
                asin, sku: row[FBA_COLUMN_MAP.sku]?.trim() || "Unknown",
                availableUnits: parseInt(row[FBA_COLUMN_MAP.availableUnits] || "0", 10),
                inboundToFba: parseInt(row[FBA_COLUMN_MAP.inboundToFba] || "0", 10),
                reservedUnits: parseInt(row[FBA_COLUMN_MAP.reservedUnits] || "0", 10),
                reservedFcTransfer: parseInt(row[FBA_COLUMN_MAP.reservedFcTransfer] || "0", 10),
                reservedFcProcessing: parseInt(row[FBA_COLUMN_MAP.reservedFcProcessing] || "0", 10),
                reservedCustomerOrder: parseInt(row[FBA_COLUMN_MAP.reservedCustomerOrder] || "0", 10),
                snapshotTimestamp: Timestamp.now(),
                source: "FBA",
            });
        });

        // Process AWD Data
        awdData.forEach(row => {
            const asin = row[AWD_COLUMN_MAP.asin]?.trim();
            if (!asin) return;

            records.push({
                asin, sku: row[AWD_COLUMN_MAP.sku]?.trim() || "Unknown",
                inboundToAwd: parseInt(row[AWD_COLUMN_MAP.inboundToAwd] || "0", 10),
                awdAvailable: parseInt(row[AWD_COLUMN_MAP.awdAvailable] || "0", 10),
                outboundToFba: parseInt(row[AWD_COLUMN_MAP.outboundToFba] || "0", 10),
                availableUnits: 0,
                reservedUnits: 0,
                snapshotTimestamp: Timestamp.now(),
                source: "AWD",
            });
        });

        // Upload to Firestore
        const inventoryCollection = collection(db, "inventory_snapshots");
        await Promise.all(records.map(record => addDoc(inventoryCollection, record)));
    },

    parseCsv(file: File, skipRows: number): Promise<string[][]> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                skipEmptyLines: true, header: false,
                complete: (results) => resolve(results.data as string[][]),
                error: reject,
            });
        });
    },
};

export default InventoryProcessor;