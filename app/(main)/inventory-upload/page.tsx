'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import Papa from 'papaparse';
import { InventoryRecordsService } from '@services/InventoryRecordsService';
import ProductService from '@services/ProductService';
import { InventoryRecord } from '../../../types/inventoryRecords';
import { Product } from '../../../types/products';
import { doc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';


const InventoryUpload = () => {
    const [inventoryUploadDialog, setInventoryUploadDialog] = useState(false);
    const [fbaFile, setFbaFile] = useState<File | null>(null);
    const [awdFile, setAwdFile] = useState<File | null>(null);
    const [salesFile, setSalesFile] = useState<File | null>(null);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

    const fetchSnapshots = async () => {
        try {
            const snapshotCollection = collection(db, 'inventory_snapshots');
            const snapshotQuery = query(snapshotCollection, orderBy('createdAt', 'desc'));
            const snapshotDocs = await getDocs(snapshotQuery);

            const snapshotData = snapshotDocs.docs.map((doc): any => {
                const data = doc.data();
                return {
                    id: doc.id,
                    createdAt: data.createdAt?.seconds ? data.createdAt : { seconds: Math.floor(Date.now() / 1000) },
                    totalUnits: data.records?.reduce((acc: number, item: any) => acc + (item.totalUnits || 0), 0) || 0,
                    records: data.records || []
                };
            });

            setSnapshots(snapshotData);
        } catch (error) {
            console.error("❌ Error fetching snapshots:", error);
        }
    };

    // Fetch snapshots on page load
    useEffect(() => {
        fetchSnapshots();
    }, []);

    const toast = useRef<Toast>(null);

    //03.11.25 confirmed column mappings
    const FBA_COLUMN_MAP = {
        asin: 3,
        sku: 1,
        fba: 6,
        inbound_to_fba: 52,
        reserved_units: 57,
        reserved_fc_transfer: 85,
        reserved_fc_processing: 86,
        reserved_customer_order: 87,
    };


    //03.11.25 confirmed column mappings
    const AWD_COLUMN_MAP = {
        asin: 3,
        sku: 1,
        inbound_to_awd: 4,
        awd: 6,
        awd_to_fba: 14,
    };

    const SALES_VELOCITY_COLUMN_MAP = {
        asin: 0,
        sku: 1,
        salesVelocity: 6,
    };

    const openInventoryUpload = () => setInventoryUploadDialog(true);
    const hideInventoryUploadDialog = () => setInventoryUploadDialog(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'fba' | 'awd' | 'sales') => {
        const file = e.target.files?.[0] || null;
        if (type === 'fba') setFbaFile(file);
        else if (type === 'awd') setAwdFile(file);
        else if (type === 'sales') setSalesFile(file);
    };

    const parseCsvFileAsArray = (file: File, skipRows: number = 0): Promise<string[][]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const csvData = reader.result as string;
                const lines = csvData.split(/\r?\n/).slice(skipRows);
                const dataToParse = lines.join('\n');
                Papa.parse(dataToParse, {
                    header: false,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data as string[][]),
                    error: (err: unknown) => reject(err),
                });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    };

    const handleUpload = async () => {
        if (!fbaFile || !awdFile || !salesFile) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Files', detail: 'Please upload FBA, AWD, and Sales reports.', life: 3000 });
            return;
        }

        try {
            const fbaData = await parseCsvFileAsArray(fbaFile, 1);
            const awdData = await parseCsvFileAsArray(awdFile, 1);
            const salesData = await parseCsvFileAsArray(salesFile, 1);

            const mergedRecords = await mergeFbaAndAwdData(fbaData, awdData);
            const salesVelocityRecords = parseSalesVelocity(salesData);

            // 🔍 Fetch product details from `products_sk`
            const productsSnapshot = await getDocs(collection(db, 'products_sk'));
            const productDataMap = new Map<string, any>();

            productsSnapshot.forEach((doc) => {
                const product = doc.data();
                productDataMap.set(product.asin, {
                    productType: product.productType || "Unknown",
                    size: product.size || "Unknown",
                    color: product.color || "Unknown",
                });
            });



            console.log('✅ Merged Inventory Records:', mergedRecords);
            console.log('✅ Sales Velocity Records:', salesVelocityRecords);

            // ✅ Upload data
            await InventoryRecordsService.bulkUploadInventory(mergedRecords);
            await InventoryRecordsService.bulkUploadSalesVelocity(salesVelocityRecords);

            // ✅ Fetch product details from `products_sk`
            const productDocs = await getDocs(collection(db, "products_sk"));
            const productMap = new Map(
                productDocs.docs.map(doc => {
                    const data = doc.data();
                    return [data.asin, { size: data.size || "Unknown", color: data.color || "Unknown", product: data.product || "Unknown" }];
                })
            );

            // ✅ Create enriched snapshot records
            const enrichedRecords = mergedRecords.map(item => {
                const productDetails = productMap.get(item.asin) || {
                    size: "Unknown",
                    color: "Unknown",
                    product: "Unknown"
                };

                return {
                    asin: item.asin,
                    sku: item.sku,
                    productType: productDetails.product,
                    size: productDetails.size,
                    color: productDetails.color,
                    salesVelocity: salesVelocityRecords.find(sv => sv.asin === item.asin)?.salesVelocity || 0,
                    fbaStock: item.fba || 0,
                    fbaReserved: item.reserved_units || 0,
                    inboundtoFba: item.inbound_to_fba || 0,
                    awdStock: item.awd || 0,
                    inboundToAwd: item.inbound_to_awd || 0,
                    awdToFba: item.awd_to_fba || 0,
                    totalUnits: (item.fba || 0) + (item.reserved_units || 0) + (item.inbound_to_fba || 0) + (item.awd || 0) + (item.inbound_to_awd || 0) + (item.awd_to_fba || 0),
                };
            });

            //Debug logs
            console.log("🔍 Product Data Map Size:", productDataMap.size);
            console.log("🔍 Sample Product Data:", Array.from(productDataMap.entries())[0]);  // Check if ASINs exist
            console.log("🔍 Enriched Records (First 5):", enrichedRecords.slice(0, 5));

            // ✅ Store in `inventory_snapshots`
            const snapshotData = {
                snapshotType: "Auto",
                totalUnits: enrichedRecords.reduce((acc, item) => acc + item.totalUnits, 0),
                records: enrichedRecords,
                createdAt: new Date(),
            };

            // ✅ Save snapshot to Firestore
            await setDoc(doc(db, 'inventory_snapshots', new Date().toISOString()), snapshotData);
            console.log("✅ Snapshot saved with enriched product data!");

            // ✅ Refresh snapshots so the table updates automatically
            await fetchSnapshots();

            toast.current?.show({ severity: 'success', summary: 'Upload Successful', detail: 'Inventory and Sales Velocity records updated.', life: 3000 });
            hideInventoryUploadDialog();
        } catch (error) {
            console.error('❌ Error processing files:', error);
            toast.current?.show({ severity: 'error', summary: 'Upload Failed', detail: 'An error occurred during processing.', life: 3000 });
        }
    };

    const mergeFbaAndAwdData = async (fbaData: string[][], awdData: string[][]): Promise<InventoryRecord[]> => {
        const existingProducts: Product[] = await ProductService.getProducts();
        const productMap = new Map(existingProducts.map((product) => [product.asin, product.sku || "Unknown SKU"]));

        const recordsMap = new Map<string, InventoryRecord>();

        const parseInteger = (value: string, defaultValue: number = 0): number => {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : parsed;
        };

        for (const row of fbaData) {
            const asin = row[FBA_COLUMN_MAP.asin]?.trim();
            if (!asin) continue;

            let sku = row[FBA_COLUMN_MAP.sku]?.trim() || productMap.get(asin) || "Unknown SKU";

            if (!recordsMap.has(asin)) {
                recordsMap.set(asin, {
                    asin,
                    sku,
                    fba: parseInteger(row[FBA_COLUMN_MAP.fba]),
                    inbound_to_fba: parseInteger(row[FBA_COLUMN_MAP.inbound_to_fba]),
                    reserved_units: parseInteger(row[FBA_COLUMN_MAP.reserved_units]),
                    reserved_fc_transfer: parseInteger(row[FBA_COLUMN_MAP.reserved_fc_transfer]),
                    reserved_fc_processing: parseInteger(row[FBA_COLUMN_MAP.reserved_fc_processing]),
                    reserved_customer_order: parseInteger(row[FBA_COLUMN_MAP.reserved_customer_order]),
                    awd: 0,
                    inbound_to_awd: 0,
                    awd_to_fba: 0,
                    snapshotDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: '',
                });
            }
        }

        for (const row of awdData) {
            const asin = row[AWD_COLUMN_MAP.asin]?.trim();
            if (!asin) continue;

            let sku = row[AWD_COLUMN_MAP.sku]?.trim() || productMap.get(asin) || "Unknown SKU";

            if (!recordsMap.has(asin)) {
                recordsMap.set(asin, {
                    asin,
                    sku,
                    fba: 0,
                    inbound_to_fba: 0,
                    reserved_units: 0,
                    awd: parseInteger(row[AWD_COLUMN_MAP.awd]),
                    inbound_to_awd: parseInteger(row[AWD_COLUMN_MAP.inbound_to_awd]),
                    awd_to_fba: parseInteger(row[AWD_COLUMN_MAP.awd_to_fba]),
                    snapshotDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: '',
                });
            } else {
                const existingRecord = recordsMap.get(asin)!;
                existingRecord.awd = parseInteger(row[AWD_COLUMN_MAP.awd], existingRecord.awd);
                existingRecord.inbound_to_awd = parseInteger(row[AWD_COLUMN_MAP.inbound_to_awd], existingRecord.inbound_to_awd);
                existingRecord.awd_to_fba = parseInteger(row[AWD_COLUMN_MAP.awd_to_fba], existingRecord.awd_to_fba);
            }
        }

        return Array.from(recordsMap.values());
    };

    const parseSalesVelocity = (salesData: string[][]): { asin: string, sku: string, salesVelocity: number }[] => {
        return salesData
            .filter(row => row[17]?.trim() === "Amazon.com") // ✅ Only include Amazon.com marketplace
            .map(row => {
                const rawVelocity = row[SALES_VELOCITY_COLUMN_MAP.salesVelocity]?.trim();
                const parsedVelocity = rawVelocity ? parseFloat(rawVelocity) : 0;

                return {
                    asin: row[SALES_VELOCITY_COLUMN_MAP.asin]?.trim() || "Unknown ASIN",
                    sku: row[SALES_VELOCITY_COLUMN_MAP.sku]?.trim() || "Unknown SKU",
                    salesVelocity: isNaN(parsedVelocity) ? 0 : parsedVelocity,
                };
            });
    };

    const handleDownloadCSV = (snapshot: any) => {
        if (!snapshot.records || snapshot.records.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'No Data', detail: 'This snapshot contains no records.', life: 3000 });
            return;
        }

        const headers = ['ASIN', 'SKU', 'Product Type', 'Size', 'Color', 'Sales Velocity', 'FBA Stock', 'FBA Reserved', 'AWD Stock', 'Inbound to AWD', 'AWD to FBA', 'Total Units'];

        const csvData = snapshot.records.map((record: any) => [
            record.asin || '',
            record.sku || '',
            record.productType || 'Unknown',
            record.size || 'Unknown',
            record.color || 'Unknown',
            record.salesVelocity || 0,
            record.fbaStock || 0,
            record.fbaReserved || 0,
            record.inboundtoFba || 0,
            record.awdStock || 0,
            record.inboundToAwd || 0,
            record.awdToFba || 0,
            record.totalUnits || 0,
        ]);

        const csvContent = [headers.join(','), ...csvData.map((row: (string | number)[]) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Inventory_Snapshot_${snapshot.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Button label="Upload Inventory Reports" icon="pi pi-upload" severity="info" onClick={openInventoryUpload} />

                    {/* ✅ Inventory Snapshots Section */}
                    <div className="card mt-4">
                        <h5>Inventory Snapshots</h5>
                        {snapshots.length === 0 ? (
                            <p>No snapshots available.</p>
                        ) : (
                            <div className="table-responsive">
                                <DataTable
                                    value={snapshots}
                                    paginator
                                    rows={5}
                                    responsiveLayout="scroll"
                                    selection={selectedSnapshot}
                                    selectionMode="single"
                                    onSelectionChange={(e) => setSelectedSnapshot(e.value)}
                                >
                                    <Column
                                        field="createdAt"
                                        header="Snapshot Date"
                                        body={(rowData) =>
                                            rowData.createdAt?.seconds
                                                ? new Date(rowData.createdAt.seconds * 1000).toLocaleString()
                                                : 'Invalid Date'
                                        }
                                        sortable
                                    />
                                    <Column field="totalUnits" header="Total Units" sortable body={(rowData) => rowData.totalUnits || 0}/>
                                    <Column
                                        header="Download"
                                        body={(rowData) => (
                                            <Button icon="pi pi-download" className="p-button-sm" onClick={() => handleDownloadCSV(rowData)} />
                                        )}
                                    />
                                </DataTable>
                            </div>
                        )}
                    </div>

                    <div className="card mt-4">
                        <h5>Snapshot Records</h5>
                        {snapshots.length === 0 ? (
                            <p>No snapshots available.</p>
                        ) : selectedSnapshot ? (
                            <div key={selectedSnapshot.id} className="mb-3">
                                <h6>
                                    {selectedSnapshot?.createdAt?.seconds
                                        ? new Date(selectedSnapshot.createdAt.seconds * 1000).toLocaleString()
                                        : 'No Date Available'}
                                </h6>
                                <DataTable value={selectedSnapshot.records || []} paginator rows={10} responsiveLayout="scroll">
                                    <Column field="asin" header="ASIN" sortable />
                                    <Column field="sku" header="SKU" sortable />
                                    <Column field="productType" header="Product Type" sortable />
                                    <Column field="size" header="Size" sortable />
                                    <Column field="color" header="Color" sortable />
                                    <Column field="salesVelocity" header="Sales Velocity" sortable />
                                    <Column field="fbaStock" header="FBA Stock" sortable />
                                    <Column field="fbaReserved" header="FBA Reserved" sortable />
                                    <Column field="inboundtoFba" header="Inbound to FBA" sortable />
                                    <Column field="awdStock" header="AWD Stock" sortable />
                                    <Column field="inboundToAwd" header="Inbound to AWD" sortable />
                                    <Column field="awdToFba" header="AWD to FBA" sortable />
                                    <Column field="totalUnits" header="Total Units" sortable />
                                </DataTable>
                            </div>
                        ) : (
                            <p>Select a snapshot to view its records.</p>  // ✅ Add a message when no snapshot is selected
                        )}
                    </div>


                    <Dialog visible={inventoryUploadDialog} style={{ width: '450px' }} header="Upload Inventory Reports" modal className="p-fluid" onHide={hideInventoryUploadDialog}>
                        <div className="field">
                            <label htmlFor="fba-file">FBA Report</label>
                            <InputText type="file" id="fba-file" accept=".csv" onChange={(e) => handleFileChange(e, 'fba')} />
                        </div>

                        <div className="field">
                            <label htmlFor="awd-file">AWD Report</label>
                            <InputText type="file" id="awd-file" accept=".csv" onChange={(e) => handleFileChange(e, 'awd')} />
                        </div>

                        <div className="field">
                            <label htmlFor="sales-file">Sellerboard Sales Report</label>
                            <InputText type="file" id="sales-file" accept=".csv" onChange={(e) => handleFileChange(e, 'sales')} />
                        </div>
                        <Button label="Process Files" icon="pi pi-check" severity="success" onClick={handleUpload} />
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default InventoryUpload;
