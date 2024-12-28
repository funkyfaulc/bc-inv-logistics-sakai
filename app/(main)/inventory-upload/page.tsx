//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/inventory-upload/page.tsx

'use client';

import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import Papa from 'papaparse';
import { InventoryRecordsService } from '../../../demo/services/InventoryRecordsService'; // Adjust path if needed
import { ProductService } from '../../../demo/services/ProductService';
import { InventoryRecord } from '../../../types/inventoryRecords';
import { Timestamp } from 'firebase/firestore';


const InventoryUpload = () => {
    const [inventoryUploadDialog, setInventoryUploadDialog] = useState(false);
    const [fbaFile, setFbaFile] = useState<File | null>(null);
    const [awdFile, setAwdFile] = useState<File | null>(null);
    const toast = useRef<Toast>(null);

    const openInventoryUpload = () => setInventoryUploadDialog(true);
    const hideInventoryUploadDialog = () => setInventoryUploadDialog(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'fba' | 'awd') => {
        const file = e.target.files?.[0] || null; //default to null if no file selected
        if (type === 'fba') setFbaFile(file);
        else if (type === 'awd') setAwdFile(file);
    };

    const handleUpload = async () => {
        if (!fbaFile || !awdFile) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Files', detail: 'Please upload both FBA and AWD files.', life: 3000 });
            return;
        }

        try {
            const fbaData = await parseCsvFile(fbaFile);
            const awdData = await parseCsvFile(awdFile);

            const mergedRecords = await mergeFbaAndAwdData(fbaData, awdData);
            for (const record of mergedRecords) {
                await InventoryRecordsService.addInventoryRecord(record);
            }

            toast.current?.show({ severity: 'success', summary: 'Upload Successful', detail: 'Inventory records updated.', life: 3000 });
            hideInventoryUploadDialog();
        } catch (error) {
            console.error('Error processing files:', error);
            toast.current?.show({ severity: 'error', summary: 'Upload Failed', detail: 'An error occurred during processing.', life: 3000 });
        }
    };

    const parseCsvFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                complete: (results) => resolve(results.data),
                error: (err) => reject(err),
            });
        });
    };

    const mergeFbaAndAwdData = async (fbaData: any[], awdData: any[]): Promise<InventoryRecord[]> => {
        // Fetch existing products to create a product map
        const existingProducts = await ProductService.getProducts();
        const productMap = new Map(existingProducts.map((product) => [product.asin, product]));
    
        const recordsMap: Record<string, InventoryRecord> = {};
    
        // Process FBA data
        for (const row of fbaData) {
            const asin = row.asin;
            if (!asin) continue;
    
            // Check if ASIN exists in product dictionary
            if (!productMap.has(asin)) {
                console.log(`ASIN ${asin} not found in product dictionary. Adding new entry.`);
                await ProductService.addProduct({
                    asin,
                    sku: row.sku || '',
                    product: 'Unknown', // Placeholder, update later if necessary
                    size: 'Unknown',
                    material: 'Unknown',
                    color: 'Unknown',
                    upc: '',
                });
                // Refresh the product map
                productMap.set(asin, {
                    id: '', // Placeholder for Firestore auto-generated ID
                    asin,
                    sku: row.sku || '',
                    product: 'Unknown', // Placeholder value
                    size: 'Unknown', // Placeholder value
                    material: 'Unknown', // Placeholder value
                    color: 'Unknown', // Placeholder value
                    upc: '', // Placeholder value
                    created_at: Timestamp.now(), // Placeholder value
                    updated_at: Timestamp.now(), // Placeholder value
                });
                            }
    
            if (!recordsMap[asin]) {
                recordsMap[asin] = {
                    asin,
                    sku: row.sku || undefined,
                    fba: parseInt(row.available_quantity || '0', 10),
                    inbound_to_fba: parseInt(row.inbound_quantity || '0', 10),
                    reserved_units: parseInt(row.reserved_quantity || '0', 10),
                    breakdown: {
                        reserved_fc_transfer: parseInt(row.reserved_fc_transfer || '0', 10),
                        reserved_fc_processing: parseInt(row.reserved_fc_processing || '0', 10),
                        reserved_customer_order: parseInt(row.reserved_customer_order || '0', 10),
                        inbound_working: parseInt(row.inbound_working || '0', 10),
                        inbound_shipped: parseInt(row.inbound_shipped || '0', 10),
                        inbound_received: parseInt(row.inbound_received || '0', 10),
                    },
                    snapshotDate: new Date(row.snapshot_date || Date.now()),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: '',
                };
            }
        }
    
        // Process AWD data
        for (const row of awdData) {
            const asin = row.asin;
            if (!asin) continue;
    
            // Ensure ASIN exists in the product dictionary
            if (!productMap.has(asin)) {
                console.log(`ASIN ${asin} not found in product dictionary. Adding new entry.`);
                await ProductService.addProduct({
                    asin,
                    sku: row.sku || '',
                    product: 'Unknown', // Placeholder, update later if necessary
                    size: 'Unknown',
                    material: 'Unknown',
                    color: 'Unknown',
                    upc: '',
                });
                productMap.set(asin, {
                    id: '', // Placeholder for Firestore auto-generated ID
                    asin,
                    sku: row.sku || '',
                    product: 'Unknown', // Placeholder value
                    size: 'Unknown', // Placeholder value
                    material: 'Unknown', // Placeholder value
                    color: 'Unknown', // Placeholder value
                    upc: '', // Placeholder value
                    created_at: Timestamp.now(), // Placeholder value
                    updated_at: Timestamp.now(), // Placeholder value
                });
                            }
    
            if (!recordsMap[asin]) {
                recordsMap[asin] = {
                    asin,
                    sku: row.sku || undefined,
                    fba: 0, //Default value
                    inbound_to_fba: 0, //Default value
                    reserved_units: 0, //Default value 
                    awd: parseInt(row.awd_quantity || '0', 10),
                    inbound_to_awd: parseInt(row.inbound_to_awd || '0', 10),
                    snapshotDate: new Date(row.snapshot_date || Date.now()),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: '',
                };
            } else {
                recordsMap[asin].awd = parseInt(row.awd_quantity || '0', 10);
                recordsMap[asin].inbound_to_awd = parseInt(row.inbound_to_awd || '0', 10);
            }
        }
    
        return Object.values(recordsMap);
    };
    

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Button label="Upload Inventory Reports" icon="pi pi-upload" severity="info" onClick={openInventoryUpload} />

                    <Dialog visible={inventoryUploadDialog} style={{ width: '450px' }} header="Upload Inventory Reports" modal className="p-fluid" onHide={hideInventoryUploadDialog}>
                        <div className="field">
                            <label htmlFor="fba-file">FBA Report</label>
                            <InputText type="file" id="fba-file" accept=".csv" onChange={(e) => handleFileChange(e, 'fba')} />
                        </div>
                        <div className="field">
                            <label htmlFor="awd-file">AWD Report</label>
                            <InputText type="file" id="awd-file" accept=".csv" onChange={(e) => handleFileChange(e, 'awd')} />
                        </div>
                        <Button label="Process Files" icon="pi pi-check" severity="success" onClick={handleUpload} />
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default InventoryUpload;
