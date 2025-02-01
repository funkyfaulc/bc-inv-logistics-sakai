//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/page.tsx

/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { OrderService } from '@/demo/services/OrderService';
import { InventoryService } from '@/demo/services/InventoryService';
import { InventoryRecordsService } from '@/demo/services/InventoryRecordsService';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { Order } from '@/types/orders';
import { InventoryRecord } from '@/types/inventoryRecords';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';

const Dashboard = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [inventory, setInventory] = useState<InventoryRecord[]>([]);
    const { layoutConfig } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchOrders();
        fetchInventory();
    }, []);

    /** 🔍 Fetch active orders (not yet available in Amazon) */
    const fetchOrders = async () => {
        try {
            console.log('📌 Fetching Orders from OrderService...');
            const data = await OrderService.getOrders();
            console.log('📦 Orders Retrieved:', data);
    
            // 🔥 Filter orders to only show Processing, Shipping, or Arrived
            const activeOrders = data.filter(order => order.orderStatus !== "Completed");
    
            console.log('✅ Active Orders:', activeOrders);
            setOrders(activeOrders);
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
        }
    };

    /** 🔍 Fetch inventory levels */
    const fetchInventory = async () => {
        try {
            const data = await InventoryRecordsService.getInventoryRecords();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    /** 📌 Get the next due milestone for each order */
    const getNextMilestone = (order: Order) => {
        console.log("🔄 Checking Milestone for Order:", order.orderId, order);

        const milestones = [
            { name: 'Final Count', date: order.finalCountDate },
            { name: 'Manufacturing Complete', date: order.finishManufactureDate },
            { name: 'Leaves Port', date: order.leavePortDate },
            { name: 'Arrives at Destination', date: order.arrivePortDate },
            { name: 'Delivered to Amazon', date: order.deliveredToAmazonDate }
        ].filter(m => m.date); // Remove null dates

        console.log("📌 Milestones Found:", milestones);

        // 🛑 If there are no milestone dates at all
        if (milestones.length === 0) {
            console.log("⚠️ No upcoming milestones for order:", order.orderId);
            return { name: "No upcoming milestones", daysRemaining: "-" };
        }

        // 🛑 If all milestone dates are in the past
        const futureMilestones = milestones.filter(m => new Date(m.date!).getTime() > Date.now());
        if (futureMilestones.length === 0) {
            console.log("⚠️ All milestones have passed for order:", order.orderId);
            return { name: "No upcoming milestones", daysRemaining: "-" };
        }

        // ✅ Get the nearest upcoming milestone
        const nextMilestone = futureMilestones.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0];

        console.log("✅ Next Milestone:", nextMilestone);

        const daysRemaining = Math.ceil((new Date(nextMilestone.date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        return { ...nextMilestone, daysRemaining };
    };

    /** 📌 Format currency */
    const formatCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    return (
        <div className="grid">
            {/* 🔥 ORDER MILESTONES */}
            <div className="col-12">
                <Card title="Upcoming Order Milestones">
                    {orders.length > 0 ? (
                        <DataTable value={orders} responsiveLayout="scroll">
                            <Column field="orderId" header="Order ID" />
                            <Column field="orderDate" header="Order Date" body={(rowData) => rowData.orderDate ? new Date(rowData.orderDate).toLocaleDateString() : '-'} />
                            <Column field="orderStatus" header="Status" body={(rowData) => (
                                <span className={`order-status ${rowData.orderStatus.toLowerCase()}`}>
                                    {rowData.orderStatus}
                                </span>
                            )} />
                            <Column 
                                field="nextMilestone" 
                                header="Next Milestone"
                                body={(rowData) => {
                                    const milestone = getNextMilestone(rowData);
                                    return `${milestone.name} (${milestone.daysRemaining} days)`;
                                }} 
                            />
                        </DataTable>
                    ) : (
                        <p>No upcoming order milestones.</p>
                    )}
                </Card>
            </div>

         {/* 🔥 INVENTORY OVERVIEW */}
            <div className="col-12 xl:col-6">
                <Card title="Inventory Summary">
                    {inventory.length > 0 ? (
                        Object.entries(
                            inventory.reduce((groups, item) => {
                                const type = item.productType || "Uncategorized"; 
                                if (!groups[type]) groups[type] = [];
                                groups[type].push(item);
                                return groups;
                            }, {} as Record<string, InventoryRecord[]>)
                        ).map(([type, items]) => (
                            <Panel key={type} header={type} toggleable collapsed className="mb-3">
                                <DataTable value={items} responsiveLayout="scroll">
                                    <Column 
                                        field="sku" 
                                        header="SKU" 
                                        style={{ width: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                                    />

                                    <Column 
                                        field="totalUnits" 
                                        header="Total Units" 
                                        style={{ width: '80px', textAlign: 'center' }} 
                                    />

                                    <Column 
                                        header="Stock Health" 
                                        body={(rowData: InventoryRecord) => (
                                            <ProgressBar 
                                                value={Math.min(((rowData.totalUnits ?? 0) / 500) * 100, 100)} 
                                                showValue={false} 
                                            />
                                        )} 
                                        style={{ width: '100px' }} 
                                    />
                                </DataTable>
                            </Panel>
                        ))
                    ) : (
                        <p>No inventory data available.</p>
                    )}
                </Card>
            </div>

            {/* 🔥 FUTURE FEATURE PLACEHOLDER */}
            <div className="col-12 xl:col-6">
                <Card title="Coming Soon: Sales Velocity & Projections">
                    <p>Track estimated stock depletion based on sales trends. 🚀</p>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;