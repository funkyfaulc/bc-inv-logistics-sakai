//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/tests/inventoryrecords/page.tsx

'use client';

import React, { useEffect } from 'react';
import { InventoryRecordsService } from '../../../../demo/services/InventoryRecordsService';


const TestInventoryRecords = () => {
    useEffect(() => {
        async function runTest() {
            try {
                // Adding a test record
                console.log('Adding a test inventory record...');
                await InventoryRecordsService.addInventoryRecord({
                    asin: 'B0TEST12345',
                    sku: 'TEST-SKU-001',
                    fba: 150,
                    inbound_to_fba: 50,
                    reserved_units: 100,
                    reserved_fc_transfer: 20,
                    reserved_fc_processing: 30,
                    reserved_customer_order: 50,
                    inbound_working: 10,
                    inbound_shipped: 40,
                    inbound_received: 60,
                    snapshotDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    notes: 'Initial test record',
                    //sourceFileName: 'FBA-Report-2024.csv',
                });
                console.log('Record added successfully!');

                // Fetching all records
                console.log('Fetching all inventory records...');
                const records = await InventoryRecordsService.getInventoryRecords();
                console.log('Fetched records:', records);

                // Updating a record
                if (records.length > 0) {
                    const firstRecordId = records[0].id;
                    if (firstRecordId) {
                        console.log('Updating the first record...');
                        await InventoryRecordsService.updateInventoryRecord(firstRecordId, { fba: 30 }, 'Updated FBA count');
                        console.log('Record updated successfully!');
                    } else {
                        console.warn('The first record has no ID.');
                    }
                } else {
                    console.warn('No records found to update.');
                }
            } catch (error) {
                console.error('Error during service test:', error);
            }
        }

        runTest();
    }, []);

    return <div>Testing Inventory Records Service...</div>;
};

export default TestInventoryRecords;
