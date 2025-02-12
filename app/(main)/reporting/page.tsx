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
                const inventoryRecords = await InventoryRecordsService.getInventoryRecords();

                // ✅ Sort by Product Type, then Size, then Color
                inventoryRecords.sort((a, b) => {
                    const productA = a.productType ?? "Unknown Product";
                    const productB = b.productType ?? "Unknown Product";
                    const sizeA = a.size ?? "Unknown Size";
                    const sizeB = b.size ?? "Unknown Size";
                    const colorA = a.color ?? "Unknown Color";
                    const colorB = b.color ?? "Unknown Color";

                    if (productA !== productB) return productA.localeCompare(productB);
                    if (sizeA !== sizeB) return sizeA.localeCompare(sizeB);
                    return colorA.localeCompare(colorB);
                });

                setInventoryRecords(inventoryRecords);
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
        const headers = ['ASIN', 'SKU', 'Product Type', 'Size', 'Color', 'Sales Velocity', 'FBA Stock', 'FBA Reserved', 'AWD Stock', 'Inbound to AWD', 'Total Units'];
        const csvData = inventoryRecords.map(record => [
            record.asin,
            record.sku,
            record.productType,
            record.size,
            record.color,
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
                        {/* 🔄 Merged Product Column (Displays Everything) */}
                        <Column
                            header="Product"
                            body={(rowData) => (
                                <div style={{ lineHeight: "1.3", fontSize: "0.85em" }}>
                                    <strong>{rowData.productType ?? "Unknown Product"}</strong> <br />
                                    {rowData.sku} <br />
                                    {rowData.size} • {rowData.color} • {rowData.material}
                                </div>
                            )}
                            style={{ minWidth: "200px" }}
                        />

                        {/* ✅ Hidden but Filterable Columns */}
                        <Column field="productType" header="Product Type" sortable filter style={{ display: "none" }} />
                        <Column field="size" header="Size" sortable filter style={{ display: "none" }} />
                        <Column field="color" header="Color" sortable filter style={{ display: "none" }} />
                        <Column field="material" header="Material" sortable filter style={{ display: "none" }} />

                        <Column field="salesVelocity" header="Sales Velocity" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="fba" header="FBA Stock" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="reserved_units" header="FBA Reserved" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="awd" header="AWD Stock" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="inbound_to_awd" header="Inbound to AWD" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="totalUnits" header="Total Units" sortable style={{ fontSize: '0.85em' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
