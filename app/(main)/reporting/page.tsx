'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { ProductService } from '../../../demo/services/ProductService';
import { OrderService } from '../../../demo/services/OrderService';
import { Product } from '@/types/products';
import { Order } from '@/types/orders';

const Reporting = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [reportData, setReportData] = useState<any[]>([]);
    const [filterDate, setFilterDate] = useState<Date | null>(null);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedProducts = await ProductService.getProducts();
                setProducts(fetchedProducts);

                const fetchedOrders = await OrderService.getOrders();
                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Error fetching reporting data:", error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch data', life: 3000 });
            }
        };

        fetchData();
    }, []);

    const generateReport = () => {
        if (!filterDate) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select a month', life: 3000 });
            return;
        }

        const selectedMonth = filterDate.getMonth();
        const selectedYear = filterDate.getFullYear();

        const filteredOrders = orders.filter(order => {
            if (!order.orderDate) return false;
            const orderMonth = order.orderDate.getMonth();
            const orderYear = order.orderDate.getFullYear();
            return orderMonth === selectedMonth && orderYear === selectedYear;
        });

        const inventoryMap: { [sku: string]: { sku: string; productName: string; totalUnits: number; totalCartons: number } } = {};

        products.forEach(product => {
            inventoryMap[product.sku || ''] = {
                sku: product.sku || '',
                productName: product.product,
                totalUnits: 0,
                totalCartons: 0,
            };
        });

        filteredOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (inventoryMap[item.sku]) {
                        inventoryMap[item.sku].totalUnits += item.totalUnitCount;
                        inventoryMap[item.sku].totalCartons += item.totalCartonCount;
                    }
                });
            }
        });

        const reportArray = Object.values(inventoryMap).filter(item => item.sku !== '');

        setReportData(reportArray);
    };

    const exportCSV = () => {
        if (reportData.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export', life: 3000 });
            return;
        }
        // Implement CSV export logic
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Generate Report" icon="pi pi-chart-bar" className="p-button-success mr-2" onClick={generateReport} />
                <Button label="Export CSV" icon="pi pi-file" className="p-button-secondary" onClick={exportCSV} />
            </React.Fragment>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <div className="p-fluid">
                        <div className="p-field">
                            <label htmlFor="month">Select Month</label>
                            <Calendar id="month" value={filterDate} onChange={(e) => setFilterDate(e.value)} view="month" dateFormat="mm/yy" placeholder="Select a month" />
                        </div>
                    </div>

                    {/* Report Table - Full Page Below */}
                    <DataTable value={reportData} paginator rows={20} responsiveLayout="scroll" className="mt-4" rowHover>
                        <Column field="sku" header="SKU" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="productName" header="Product Name" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="totalUnits" header="Total Units" sortable style={{ fontSize: '0.85em' }}></Column>
                        <Column field="totalCartons" header="Total Cartons" sortable style={{ fontSize: '0.85em' }}></Column>
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Reporting;