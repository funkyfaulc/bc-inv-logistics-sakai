// src/pages/OrderManagement.jsx

import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs'; // Import dayjs for date formatting
import { getOrders, createOrder, updateOrder, deleteOrder } from '../services/OrderService';

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [orderDialog, setOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({ order_id: '', order_date: null, expected_delivery: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const data = await getOrders();
    const formattedData = data.map(order => ({
      ...order,
      order_date: order.order_date ? order.order_date.toDate() : null, // Convert Firestore Timestamp to Date object
      expected_delivery: order.expected_delivery ? order.expected_delivery.toDate() : null, // Convert Firestore Timestamp to Date object
    }));
    setOrders(formattedData);
  };
  

  const openNewOrderDialog = () => {
    setNewOrder({ order_id: '', order_date: null, expected_delivery: null });
    setOrderDialog(true);
  };

  const saveOrder = async () => {
    try {
      if (newOrder.id) {
        await updateOrder(newOrder.id, newOrder);
      } else {
        await createOrder(newOrder);
      }
      setOrderDialog(false);
      fetchOrders();  // Refresh orders list
      navigate('/dashboard');  // Navigate back to the dashboard after saving
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const deleteSelectedOrder = async (id) => {
    await deleteOrder(id);
    fetchOrders();
  };

  const onInputChange = (e, fieldName) => {
    setNewOrder({ ...newOrder, [fieldName]: e.target.value });
  };

  const onDateChange = (e, fieldName) => {
    setNewOrder({ ...newOrder, [fieldName]: e.value });
  };

  const orderDialogFooter = (
    <React.Fragment>
      <Button label="Cancel" icon="pi pi-times" onClick={() => setOrderDialog(false)} className="p-button-text" />
      <Button label="Save" icon="pi pi-check" onClick={saveOrder} autoFocus />
    </React.Fragment>
  );

  return (
    <div className="order-management">
      <h2>Order Management</h2>
      <Button label="New Order" icon="pi pi-plus" className="p-button-success" onClick={openNewOrderDialog} />
      <Button label="Back to Dashboard" icon="pi pi-home" className="p-button-secondary" onClick={() => navigate('/dashboard')} // Navigates to the dashboard route
      />
      <DataTable value={orders} paginator rows={10}>
        <Column field="order_id" header="Order ID"></Column>
        <Column field="order_date" header="Order Date" body={(rowData) => rowData.order_date ? dayjs(rowData.order_date).format('MM/DD/YYYY') : ''}></Column>
        <Column field="expected_delivery" header="Expected Delivery" body={(rowData) => rowData.expected_delivery ? dayjs(rowData.expected_delivery).format('MM/DD/YYYY') : ''}></Column>
        <Column
            header="Actions"
            body={(rowData) => (
            <>
                <Button 
                icon="pi pi-pencil" 
                className="p-button-rounded p-button-warning" 
                onClick={() => { 
                    setSelectedOrder(rowData); 
                    setNewOrder({ 
                    ...rowData, 
                    order_date: rowData.order_date ? new Date(rowData.order_date) : null,
                    expected_delivery: rowData.expected_delivery ? new Date(rowData.expected_delivery) : null
                    }); 
                    setOrderDialog(true); 
                }} 
                />
                <Button 
                icon="pi pi-trash" 
                className="p-button-rounded p-button-danger" 
                onClick={() => deleteSelectedOrder(rowData.id)} 
                />
            </>
         )}
        />
      </DataTable>


      <Dialog visible={orderDialog} header="Order Details" footer={orderDialogFooter} onHide={() => setOrderDialog(false)}>
        <div className="p-field">
          <label htmlFor="order_id">Order ID</label>
          <InputText id="order_id" value={newOrder.order_id} onChange={(e) => onInputChange(e, 'order_id')} />
        </div>
        <div className="p-field">
          <label htmlFor="order_date">Order Date</label>
          <Calendar id="order_date" value={newOrder.order_date} onChange={(e) => onDateChange(e, 'order_date')} showIcon />
        </div>
        <div className="p-field">
          <label htmlFor="expected_delivery">Expected Delivery</label>
          <Calendar id="expected_delivery" value={newOrder.expected_delivery} onChange={(e) => onDateChange(e, 'expected_delivery')} showIcon />
        </div>
      </Dialog>
    </div>
  );
};
