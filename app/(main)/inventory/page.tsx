// bc-inv-logistics-sakai/app/(main)/inventory/page.tsx
'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import Papa from 'papaparse';
import { InventoryService } from '../../../demo/services/InventoryService';
import { InventoryUpdate } from '../../../types/inventory';
import { Timestamp } from 'firebase/firestore';




const Inventory = () => {
    const [inventoryUploadDialog, setInventoryUploadDialog] = useState(false);
    const toast = useRef<Toast>(null); //Define the toast reference

    const openInventoryUpload = () => setInventoryUploadDialog(true);
    const hideInventoryUploadDialog = () => setInventoryUploadDialog(false);

    const handleInventoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.error('No file selected');
            return;
        }

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                let data = results.data;

                // Convert the headers to lowercase for consistency
                data = data.map((inventoryUpdate) => {
                    const normalizedInventoryUpdate: { [key: string]: any } = {};

                    // Explicitly cast inventoryUpdate as a Record<string, any> to safely iterate over its properties
                    const inventoryObject = inventoryUpdate as Record<string, any>;

                    for (const key in inventoryObject) {
                        normalizedInventoryUpdate[key.toLowerCase()] = inventoryObject[key];
                    }

                    return normalizedInventoryUpdate;
                });

                console.log('Parsed and normalized CSV data for inventory:', data);
                await bulkUploadInventoryUpdates(data);
            },
            error: (err) => {
                console.error('Error parsing CSV for inventory:', err);
            }
        });
    };

    // Bulk upload inventory updates
    const bulkUploadInventoryUpdates = async (inventoryUpdates: any[]) => {
        let totalAdded = 0; // Keep track of successfully added inventory updates
        let errors = []; // Keep track of errors

        try {
            for (const update of inventoryUpdates) {
                // Validate required fields (asin and sku)
                if (!update.asin || !update.sku) {
                    errors.push(`Missing required fields for ASIN: ${update.asin || 'N/A'} SKU: ${update.sku || 'N/A'}`);
                    continue;
                }

                // Prepare the inventory update object
                const inventoryUpdate: Omit<InventoryUpdate, 'timestamp'> = {
                    asin: update.asin,
                    sku: update.sku,
                    availableUnits: parseInt(update.availableunits, 10) || 0,
                    reservedUnits: parseInt(update.reservedunits, 10) || 0,
                    inboundUnits: parseInt(update.inboundunits, 10) || 0
                };

                // Add inventory update to Firestore
                console.log('Adding inventory update:', inventoryUpdate);
                await InventoryService.addInventoryUpdate({
                    ...inventoryUpdate,
                    timestamp: Timestamp.now() // Store timestamp of when the inventory was updated);
                });
                totalAdded++; // Increment successfully added inventory updates
            }

            toast.current?.show({ severity: 'success', summary: 'Upload Successful', detail: `${totalAdded} inventory updates added`, life: 3000 });

            // If there were errors, display them
            if (errors.length > 0) {
                toast.current?.show({ severity: 'warn', summary: 'Upload Warnings', detail: `Some updates were skipped: ${errors.join(', ')}`, life: 5000 });
            }
        } catch (error) {
            console.error('Error in bulk inventory upload:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload inventory updates', life: 3000 });
        }
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Button label="Upload Inventory Updates" icon="pi pi-upload" severity="info" onClick={openInventoryUpload} />

                    <Dialog visible={inventoryUploadDialog} style={{ width: '450px' }} header="Upload Inventory" modal className="p-fluid" onHide={hideInventoryUploadDialog}>
                        <div className="field">
                            <label htmlFor="file">Upload CSV File</label>
                            <InputText type="file" accept=".csv" onChange={handleInventoryFileUpload} />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};


const InventoryPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <Inventory />
    </Suspense>
);

export default InventoryPage;
