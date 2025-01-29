'use client';

import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import Papa from 'papaparse';
import { InventoryRecordsService } from '../../../demo/services/InventoryRecordsService';
import ProductService from '../../../demo/services/ProductService';
import { InventoryRecord } from '../../../types/inventoryRecords';
import { Product } from '../../../types/products';

const InventoryUpload = () => {
    const [inventoryUploadDialog, setInventoryUploadDialog] = useState(false);
    const [fbaFile, setFbaFile] = useState<File | null>(null);
    const [awdFile, setAwdFile] = useState<File | null>(null);
    const toast = useRef<Toast>(null);

    const FBA_COLUMN_MAP = {
        asin: 3,
        sku: 1,
        fba: 6,
        inbound_to_fba: 89,
        reserved_units: 95,
    };

    const AWD_COLUMN_MAP = {
        asin: 3,
        sku: 1,
        inbound_to_awd: 4,
        awd: 6,
    };

    const openInventoryUpload = () => setInventoryUploadDialog(true);
    const hideInventoryUploadDialog = () => setInventoryUploadDialog(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'fba' | 'awd') => {
        const file = e.target.files?.[0] || null;
        if (type === 'fba') setFbaFile(file);
        else if (type === 'awd') setAwdFile(file);
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
        if (!fbaFile || !awdFile) {
            toast.current?.show({ severity: 'warn', summary: 'Missing Files', detail: 'Please upload both FBA and AWD files.', life: 3000 });
            return;
        }

        try {
            const fbaData = await parseCsvFileAsArray(fbaFile, 1);
            const awdData = await parseCsvFileAsArray(awdFile, 1);

            const mergedRecords = await mergeFbaAndAwdData(fbaData, awdData);
            console.log('Merged Records:', mergedRecords);

            for (const record of mergedRecords) {
                console.log(`Updating asin: ${record.asin}, sku: ${record.sku}, SnapshotDate: ${record.snapshotDate}`);
                await InventoryRecordsService.updateInventoryRecordByAsin(record.asin, record);
            }

            toast.current?.show({ severity: 'success', summary: 'Upload Successful', detail: 'Inventory records updated.', life: 3000 });
            hideInventoryUploadDialog();
        } catch (error) {
            console.error('Error processing files:', error);
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
                    awd: 0,
                    inbound_to_awd: 0,
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
                    snapshotDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: '',
                });
            } else {
                const existingRecord = recordsMap.get(asin)!;
                existingRecord.awd = parseInteger(row[AWD_COLUMN_MAP.awd], existingRecord.awd);
                existingRecord.inbound_to_awd = parseInteger(row[AWD_COLUMN_MAP.inbound_to_awd], existingRecord.inbound_to_awd);
            }
        }

        // ✅ Calculate total units for each record
        recordsMap.forEach((record) => {
            record.totalUnits = (record.fba || 0) + (record.inbound_to_fba || 0) + (record.awd || 0) + (record.inbound_to_awd || 0);
        });

        return Array.from(recordsMap.values());
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