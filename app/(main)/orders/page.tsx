'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { OrderService } from '../../../demo/service/OrderService';
import { useRouter } from 'next/navigation';  

interface Order {
    id: string;
    orderId: string;
    orderDate: Date | null;
    finalCountDate: Date | null;
    finishManufactureDate: Date | null;
    leavePortDate: Date | null;
    arrivePortDate: Date | null;
    deliveredToAmazonDate: Date | null;
    availableInAmazonDate: Date | null;
    coverageDate: Date | null;
    contract: string;
    deposit: number;
    totalCost: number;
}

const OrderManagement = () => {
    const emptyOrder: Order = {
        id: '',
        orderId: '',
        orderDate: null,
        finalCountDate: null,
        finishManufactureDate: null,
        leavePortDate: null,
        arrivePortDate: null,
        deliveredToAmazonDate: null,
        availableInAmazonDate: null,
        coverageDate: null,
        contract: '',
        deposit: 0,
        totalCost: 0,
    };

    const [orders, setOrders] = useState<Order[]>([]);  // Initialize with an empty array
    const [orderDialog, setOrderDialog] = useState(false);
    const [deleteOrderDialog, setDeleteOrderDialog] = useState(false);
    const [deleteOrdersDialog, setDeleteOrdersDialog] = useState(false);
    const [order, setOrder] = useState(emptyOrder);
    const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const toast = useRef<Toast>(null);
    const dt = useRef<DataTable>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                console.log("Fetching orders...");  // Log fetching action
                const data = await OrderService.getOrders();
                console.log("Orders fetched:", data);  // Log the orders fetched
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);  // Log errors
            }
        };
    
        fetchOrders();
    }, []);

    const openNew = () => {
        setOrder(emptyOrder);
        setSubmitted(false);
        setOrderDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setOrderDialog(false);
    };

    const saveOrder = async () => {
        setSubmitted(true);

        if (order.orderId && order.orderDate) {
            let _orders = [...orders];
            let _order = { ...order };

            if (order.id) {
                const index = findIndexById(order.id);
                _orders[index] = _order;
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Order Updated', life: 3000 });

                await OrderService.updateOrder(order.id, _order);
            } else {
                // Ensure orderId is passed explicitly here
                _order.orderId = order.orderId;
                _orders.push(_order);
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Order Created', life: 3000 });

                await OrderService.addOrder(_order);
            }

            setOrders(_orders);
            setOrderDialog(false);
            setOrder(emptyOrder);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Order ID and Order Date are required', life: 3000 });
        }
    };

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < orders.length; i++) {
            if (orders[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const editOrder = (order) => {
        setOrder({ ...order });
        setOrderDialog(true);
    };

    const confirmDeleteOrder = (order) => {
        setOrder(order);
        setDeleteOrderDialog(true);
    };

    const deleteOrder = async () => {
        await OrderService.deleteOrder(order.id);

        let _orders = orders.filter((val) => val.id !== order.id);
        setOrders(_orders);
        setDeleteOrderDialog(false);
        setOrder(emptyOrder);
        toast.current.show({ severity: 'success', summary: 'Successful', detail: '1 Order Deleted', life: 3000 });
    };

    const deleteSelectedOrders = async () => {
        for (const selectedOrder of selectedOrders) {
            await OrderService.deleteOrder(selectedOrder.id);
        }

        let _orders = orders.filter((val) => !selectedOrders.includes(val));
        setOrders(_orders);
        setDeleteOrdersDialog(false);
        setSelectedOrders(null);
        toast.current.show({ severity: 'success', summary: 'Successful', detail: `${selectedOrders.length} Orders Deleted`, life: 3000 });
    };

    const onInputChange = (e, name) => {
        const val = e.target && e.target.value;
        let _order = { ...order };

        // Only check for Date instance if the field is related to dates
        if (['orderDate', 'finalCountDate', 'finishManufactureDate', 'leavePortDate', 'arrivePortDate', 'deliveredToAmazonDate', 'availableInAmazonDate', 'coverageDate'].includes(name)) {
            _order[name] = val instanceof Date ? val : null; // Handle dates
        } else {
            _order[name] = val; // Direct assignment for non-date fields like orderId
        }

        setOrder(_order);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="New" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
                <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={() => setDeleteOrdersDialog(true)} disabled={!selectedOrders || !selectedOrders.length} />
            </React.Fragment>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Orders</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.currentTarget.value)} placeholder="Search..." />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => editOrder(rowData)} />
                <Button icon="pi pi-eye" className="p-button-rounded p-button-info mr-2" onClick={() => router.push(`/orders/${rowData.id}`)} />
                <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => confirmDeleteOrder(rowData)} />
            </React.Fragment>
        );
    };

    const orderDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" text onClick={saveOrder} />
        </>
    );

    const deleteOrderDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteOrderDialog(false)} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteOrder} />
        </>
    );

    const deleteOrdersDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteOrdersDialog(false)} />
            <Button label="Yes" icon="pi pi-check" text onClick={deleteSelectedOrders} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
            
                    <DataTable
                        ref={dt}
                        value={orders}
                        selection={selectedOrders}
                        onSelectionChange={(e) => {
                            console.log("Selected orders:", e.value);  // Log selected orders
                            setSelectedOrders(e.value);
                        }}                        dataKey="id"
                        paginator
                        rows={12}
                        rowsPerPageOptions={[6, 12, 24]}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
                        globalFilter={globalFilter}
                        emptyMessage="No orders found."
                        header={header}
                        responsiveLayout="scroll"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        
                         {/* Render Order ID without logging */}
                        <Column field="orderId" header="Order ID" sortable body={(rowData) => rowData.orderId}></Column>
                        
                         {/* Render Dates */}
                        <Column field="orderDate" header="Order Date" sortable body={(rowData) => rowData.orderDate ? new Date(rowData.orderDate).toLocaleDateString() : ''}></Column>
                        <Column field="finalCountDate" header="Final Count Date" sortable body={(rowData) => rowData.finalCountDate ? new Date(rowData.finalCountDate).toLocaleDateString() : ''}></Column>
                        <Column field="finishManufactureDate" header="Finish Manufacture Date" sortable body={(rowData) => rowData.finishManufactureDate ? new Date(rowData.finishManufactureDate).toLocaleDateString() : ''}></Column>
                        <Column field="leavePortDate" header="Leave Port Date" sortable body={(rowData) => rowData.leavePortDate ? new Date(rowData.leavePortDate).toLocaleDateString() : ''}></Column>
                        <Column field="arrivePortDate" header="Arrive Port Date" sortable body={(rowData) => rowData.arrivePortDate ? new Date(rowData.arrivePortDate).toLocaleDateString() : ''}></Column>
                        <Column field="deliveredToAmazonDate" header="Delivered to Amazon" sortable body={(rowData) => rowData.deliveredToAmazonDate ? new Date(rowData.deliveredToAmazonDate).toLocaleDateString() : ''}></Column>
                        <Column field="availableInAmazonDate" header="Available in Amazon" sortable body={(rowData) => rowData.availableInAmazonDate ? new Date(rowData.availableInAmazonDate).toLocaleDateString() : ''}></Column>
                        <Column field="coverageDate" header="Coverage Date" sortable body={(rowData) => rowData.coverageDate ? new Date(rowData.coverageDate).toLocaleDateString() : ''}></Column>    

                        {/* Render other fields */}
                        <Column field="contract" header="Contract" sortable body={(rowData) => rowData.contract}></Column>
                        <Column field="deposit" header="Deposit" sortable body={(rowData) => 
                            rowData.deposit ? `$${rowData.deposit.toLocaleString('en-US', {style: 'currency' , currency: 'USD'}).replace('$', '')}` : `$0.00`}
                            ></Column>
                        <Column field="totalCost" header="Total Cost" sortable body={(rowData) => 
                            rowData.totalCost ? `$${rowData.totalCost.toLocaleString('en-US', {style: 'currency' , currency: 'USD'}).replace('$', '')}` : `$0.00`}
                            ></Column>

                        {/* Action Buttons */}
                        <Column body={actionBodyTemplate} headerStyle={{ width: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={orderDialog} style={{ width: '450px' }} header="Order Details" modal className="p-fluid" footer={orderDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="orderId">Order ID</label>
                            <InputText id="orderId" value={order.orderId} onChange={(e) => onInputChange(e, 'orderId')}
                                className={classNames({ 'p-invalid': submitted && !order.orderId })}  // Validation check
                                disabled={!!order.id}  // Disable if editing an existing order
                            />
                            {submitted && !order.orderId && <small className="p-invalid">Order ID is required.</small>}
                        </div>

                        <div className="field">
                            <label htmlFor="orderDate">Order Date</label>
                            <Calendar id="orderDate" value={order.orderDate} onChange={(e) => onInputChange(e, 'orderDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="finalCountDate">Final Count Date</label>
                            <Calendar id="finalCountDate" value={order.finalCountDate} onChange={(e) => onInputChange(e, 'finalCountDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="finishManufactureDate">Finish Manufacture Date</label>
                            <Calendar id="finishManufactureDate" value={order.finishManufactureDate} onChange={(e) => onInputChange(e, 'finishManufactureDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="leavePortDate">Leave Port Date</label>
                            <Calendar id="leavePortDate" value={order.leavePortDate} onChange={(e) => onInputChange(e, 'leavePortDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="arrivePortDate">Arrive Port Date</label>
                            <Calendar id="arrivePortDate" value={order.arrivePortDate} onChange={(e) => onInputChange(e, 'arrivePortDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="deliveredToAmazonDate">Delivered to Amazon Date</label>
                            <Calendar id="deliveredToAmazonDate" value={order.deliveredToAmazonDate} onChange={(e) => onInputChange(e, 'deliveredToAmazonDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="availableInAmazonDate">Available in Amazon Date</label>
                            <Calendar id="availableInAmazonDate" value={order.availableInAmazonDate} onChange={(e) => onInputChange(e, 'availableInAmazonDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="coverageDate">Coverage Date</label>
                            <Calendar id="coverageDate" value={order.coverageDate} onChange={(e) => onInputChange(e, 'coverageDate')} showIcon />
                        </div>

                        <div className="field">
                            <label htmlFor="contract">Contract</label>
                            <InputText id="contract" value={order.contract} onChange={(e) => onInputChange(e, 'contract')} />
                        </div>

                        <div className="field">
                            <label htmlFor="deposit">Deposit</label>
                            <InputText id="deposit" value={order.deposit} onChange={(e) => onInputChange(e, 'deposit')} />
                        </div>

                        <div className="field">
                            <label htmlFor="totalCost">Total Cost</label>
                            <InputText id="totalCost" value={order.totalCost} onChange={(e) => onInputChange(e, 'totalCost')} />
                        </div>
                    </Dialog>

                    <Dialog visible={deleteOrderDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteOrderDialogFooter} onHide={() => setDeleteOrderDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {order && (
                                <span>
                                    Are you sure you want to delete <b>{order.orderId}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteOrdersDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteOrdersDialogFooter} onHide={() => setDeleteOrdersDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {order && <span>Are you sure you want to delete the selected orders?</span>}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;