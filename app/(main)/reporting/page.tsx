'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InventoryRecordsService } from '@services/InventoryRecordsService';
import { MultiSelect } from 'primereact/multiselect';

const Reporting = () => {
    const [inventoryRecords, setInventoryRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef<Toast>(null);

    const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);


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
                    const skuA = a.sku ?? "Unknown SKU";
                    const skuB = b.sku ?? "Unknown SKU";

                    if (productA !== productB) return productA.localeCompare(productB);
                    if (sizeA !== sizeB) return sizeA.localeCompare(sizeB);
                    if (colorA != colorB) return colorA.localeCompare(colorB);
                    return skuA.localeCompare(skuB); // ✅ Final tie-breaker: sort by SKU
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
        const headers = ['ASIN', 'SKU', 'Product Type', 'Size', 'Color', 'Material', 'Sales Velocity', 'FBA Stock', 'Inbound to FBA', 'FBA Reserved', 'AWD Stock', 'Inbound to AWD', 'Total Units'];
        const csvData = inventoryRecords.map(record => [
            record.asin,
            record.sku,
            record.productType,
            record.size,
            record.color,
            record.material ?? "Unknown Material",
            record.salesVelocity,
            record.fba,
            record.inbound_to_fba,
            record.reserved_units,
            record.awd,
            record.inbound_to_awd,
            record.awd_to_fba,
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
        <div className="flex align-items-center gap-3">
            <MultiSelect
                value={selectedProductTypes}
                options={Array.from(new Set(inventoryRecords.map(item => item.productType)))}
                onChange={(e) => setSelectedProductTypes(e.value)}
                placeholder="Filter by Product Type"
                className="p-multiselect-sm"
            />
            <MultiSelect
                value={selectedSizes}
                options={Array.from(new Set(inventoryRecords.map(item => item.size)))}
                onChange={(e) => setSelectedSizes(e.value)}
                placeholder="Filter by Size"
                className="p-multiselect-sm"
            />
            <MultiSelect
                value={selectedColors}
                options={Array.from(new Set(inventoryRecords.map(item => item.color)))}
                onChange={(e) => setSelectedColors(e.value)}
                placeholder="Filter by Color"
                className="p-multiselect-sm"
            />
            <MultiSelect
                value={selectedMaterials}
                options={Array.from(new Set(inventoryRecords.map(item => item.material)))}
                onChange={(e) => setSelectedMaterials(e.value)}
                placeholder="Filter by Material"
                className="p-multiselect-sm"
            />
            <Button label="Export CSV" icon="pi pi-file" className="p-button-secondary" onClick={exportCSV} />
        </div>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                            value={inventoryRecords.filter(record =>
                                (selectedProductTypes.length === 0 || selectedProductTypes.includes(record.productType)) &&
                                (selectedSizes.length === 0 || selectedSizes.includes(record.size)) &&
                                (selectedColors.length === 0 || selectedColors.includes(record.color)) &&
                                (selectedMaterials.length === 0 || selectedMaterials.includes(record.material))
                            )}
                            paginator
                            rows={20}
                            loading={loading}
                            responsiveLayout="scroll"
                            className="mt-4"
                            rowHover
                            reorderableColumns
                        >

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

                        <Column field="salesVelocity" header="Sales Velocity" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="fba" header="FBA Stock" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="inbound_to_fba" header="Inbound to FBA" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="reserved_units" header="FBA Reserved" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="awd" header="AWD Stock" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="inbound_to_awd" header="Inbound to AWD" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="awd_to_fba" header="AWD to FBA" sortable style={{ fontSize: '0.85em' }} />
                        <Column field="totalUnits" header="Total Units" sortable style={{ fontSize: '0.85em' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
