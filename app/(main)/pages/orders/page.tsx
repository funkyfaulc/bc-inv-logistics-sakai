/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';  // Add this import for the date picker
import { classNames } from 'primereact/utils';
import { OrderService } from '../../../../demo/service/OrderService';

const OrderManagement = () => {
    const emptyOrder = {
        id: '',
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

    const [orders, setOrders] = useState(null);
    const [orderDialog, setOrderDialog] = useState(false);
    const [deleteOrderDialog, setDeleteOrderDialog] = useState(false);
    const [deleteOrdersDialog, setDeleteOrdersDialog] = useState(false);
    const [order, setOrder] = useState(emptyOrder);
    const [selectedOrders, setSelectedOrders] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    const toast = useRef(null);
    const dt = useRef(null);

    // Fetch Orders from Firestore
    useEffect(() => {
        OrderService.getOrders().then((data) => setOrders(data));
    }, []);

    // Open New Order Dialog
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
    
        if (order.orderDate) {
            let _orders = [...orders];
            let _order = { ...order };
    
            if (order.id) {
                const index = findIndexById(order.id);
                _orders[index] = _order;
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Order Updated', life: 3000 });
    
                // Firestore update order
                await OrderService.updateOrder(order.id, _order);
            } else {
                // Remove manual ID generation
                // Firestore will handle ID generation
                _orders.push(_order);
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Order Created', life: 3000 });
    
                // Firestore add order
                await OrderService.addOrder(_order);
            }
    
            setOrders(_orders);
            setOrderDialog(false);
            setOrder(emptyOrder);
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

    const createId = () => {
        let id = '';
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    //  Edit Single Order
    const editOrder = (order) => {
        setOrder({ ...order });
        setOrderDialog(true);  // This opens the dialog and populates it with the selected order's data
    };
    

    // Confirm and Delete Single Order
    const confirmDeleteOrder = (order) => {
        setOrder(order);
        setDeleteOrderDialog(true);
    };

    const deleteOrder = async () => {
        try {
            await OrderService.deleteOrder(order.id);

            let _orders = orders.filter((val) => val.id !== order.id);
            setOrders(_orders);
            setDeleteOrderDialog(false);
            setOrder(emptyOrder);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: '1 Order Deleted', life: 3000 });
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete order', life: 3000 });
        }
    };

    // Delete Selected Orders
    const deleteSelectedOrders = async () => {
        try {
            for (const selectedOrder of selectedOrders) {
                await OrderService.deleteOrder(selectedOrder.id);
            }

            let _orders = orders.filter((val) => !selectedOrders.includes(val));
            const deletedCount = selectedOrders.length;
            setOrders(_orders);
            setDeleteOrdersDialog(false);
            setSelectedOrders(null);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: `${deletedCount} Orders Deleted`, life: 3000 });
        } catch (error) {
            console.error('Error deleting orders:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete orders', life: 3000 });
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _order = { ...order };
        _order[`${name}`] = val;
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
                        onSelectionChange={(e) => setSelectedOrders(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
                        globalFilter={globalFilter}
                        emptyMessage="No orders found."
                        header={header}
                        responsiveLayout="scroll"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column field="orderDate" header="Order Date" sortable></Column>
                        <Column field="finalCountDate" header="Final Count Date" sortable></Column>
                        <Column field="finishManufactureDate" header="Finish Manufacture Date" sortable></Column>
                        <Column field="leavePortDate" header="Leave Port Date" sortable></Column>
                        <Column field="arrivePortDate" header="Arrive Port Date" sortable></Column>
                        <Column field="deliveredToAmazonDate" header="Delivered to Amazon" sortable></Column>
                        <Column field="availableInAmazonDate" header="Available in Amazon" sortable></Column>
                        <Column field="contract" header="Contract" sortable></Column>
                        <Column field="deposit" header="Deposit" sortable></Column>
                        <Column body={actionBodyTemplate} headerStyle={{ width: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={orderDialog} style={{ width: '450px' }} header="Order Details" modal className="p-fluid" footer={orderDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="orderId">Order ID</label>
                            <InputText id="orderId" value={order.orderId} onChange={(e) => onInputChange(e, 'orderId')} 
                            disabled={!!order.id}  // Disable if editing an existing order
                            className={classNames({ 'p-invalid': submitted && !order.orderId })}
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
                                    Are you sure you want to delete <b>{order.name}</b>?
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
