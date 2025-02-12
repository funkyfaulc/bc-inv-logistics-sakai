'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InventoryRecordsService } from '@services/InventoryRecordsService';

const Reporting = () => {
    const [inventoryRecords, setInventoryRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get all inventory records
                const inventoryRecords = await InventoryRecordsService.getInventoryRecords();
                const salesVelocityMap = await InventoryRecordsService.getSalesVelocity();

                // Merge FBA and AWD data per ASIN
                const mergedRecords = inventoryRecords.map(record => ({
                    asin: record.asin,
                    sku: record.sku,
                    salesVelocity: salesVelocityMap.get(record.asin) ?? 0, // ✅ Add sales velocity from Sellerboard
                    fba: record.fba ?? 0,
                    inbound_to_fba: record.inbound_to_fba ?? 0,
                    awd: record.awd ?? 0,
                    inbound_to_awd: record.inbound_to_awd ?? 0,
                    reserved_units: record.reserved_units ?? 0,
                    reserved_fc_transfer: record.reserved_fc_transfer ?? 0,
                    reserved_fc_processing: record.reserved_fc_processing ?? 0,
                    reserved_customer_order: record.reserved_customer_order ?? 0,
                    totalUnits: (record.fba ?? 0) + (record.inbound_to_fba ?? 0) + (record.awd ?? 0) + (record.inbound_to_awd ?? 0) + (record.reserved_units ?? 0),
                    reserved: (record.reserved_units ?? 0) + (record.reserved_fc_transfer ?? 0) + (record.reserved_fc_processing ?? 0),
                    snapshotDate: record.snapshotDate ?? new Date(),
                    createdAt: record.createdAt ?? new Date(),
                    updatedAt: record.updatedAt ?? new Date(),
                }));

                setInventoryRecords(mergedRecords);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching inventory data:", error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch inventory records', life: 3000 });
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const exportCSV = () => {
        if (inventoryRecords.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
            return;
        }

        // Convert data to CSV format
        const headers = ['ASIN', 'SKU', 'Sales Velocity', 'FBA Stock', 'FBA Reserved', 'AWD Stock', 'Inbound to AWD', 'Total Units'];
        const csvData = inventoryRecords.map(record => [
            record.asin,
            record.sku,
            record.salesVelocity,
            record.fba,
            record.reserved_units,
            record.awd,
            record.inbound_to_awd,
            record.totalUnits,
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'inventory_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const leftToolbarTemplate = () => (
        <React.Fragment>
            <Button label="Export CSV" icon="pi pi-file" className="p-button-secondary" onClick={exportCSV} />
        </React.Fragment>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable value={inventoryRecords} paginator rows={20} loading={loading} responsiveLayout="scroll" className="mt-4" rowHover reorderableColumns>
                        <Column field="asin" header="ASIN" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="sku" header="SKU" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="salesVelocity" header="Sales Velocity" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="fba" header="FBA Stock" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="reserved_units" header="FBA Reserved" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="awd" header="AWD Stock" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="inbound_to_awd" header="Inbound to AWD" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="totalUnits" header="Total Units" sortable style={{ fontSize: '0.85em' }}></Column>

                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
