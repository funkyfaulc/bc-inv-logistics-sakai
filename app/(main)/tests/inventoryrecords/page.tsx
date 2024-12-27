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
                    breakdown: {
                        production: 100,
                        inbound_to_awd: 50,
                        fba: 20,
                        awd: 10,
                    },
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
