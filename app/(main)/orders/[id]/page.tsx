'use client';
import { useParams } from 'next/navigation';  // Use useParams for dynamic route param
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { OrderService } from '@/demo/service/OrderService';
import { Timeline } from 'primereact/timeline';
import OrderEditModal from '@/app/(main)/orders/modal/OrderEditModal';

interface Order {
    id?: string;
    orderId: string;
    orderDate: Date | null;
    finalCountDate: Date | null;
    finishManufactureDate: Date | null;
    leavePortDate: Date | null;
    arrivePortDate: Date | null;
    deliveredToAmazonDate: Date | null;
    availableInAmazonDate: Date | null;
    coverageDate: Date | null;
    contract?: string;
    deposit?: number;
    totalCost?: number;
}


const OrderDetails = () => {
    const { id } = useParams();  // Use useParams to get the dynamic route param
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (id) {
            OrderService.getOrderById(id).then((data) => {
                setOrder(data);
                setLoading(false);
            });
        }
    }, [id]);

    const openEditModal = () => {
        setEditDialogVisible(true); // Open the modal
    };

    const saveOrder = async () => {
        setSubmitted(true);
        if (order && order.orderId) {
            await OrderService.updateOrder(order.id as string, order);
            setEditDialogVisible(false);  // Close modal after saving
            setSubmitted(false);
        }
    };

    if (loading) return <p>Loading Order Details...</p>;
    if (!order) return <p>Order not found</p>;

    const events = [
        { status: 'Order Placed', date: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A', icon: 'pi pi-shopping-cart' },
        { status: 'Final Count', date: order.finalCountDate ? new Date(order.finalCountDate).toLocaleDateString() : 'N/A', icon: 'pi pi-check' },
        { status: 'Manufacturing Complete', date: order.finishManufactureDate ? new Date(order.finishManufactureDate).toLocaleDateString() : 'N/A', icon: 'pi pi-cog' },
        { status: 'Left Port', date: order.leavePortDate ? new Date(order.leavePortDate).toLocaleDateString() : 'N/A', icon: 'pi pi-send' },
        { status: 'Arrived at Destination', date: order.arrivePortDate ? new Date(order.arrivePortDate).toLocaleDateString() : 'N/A', icon: 'pi pi-map-marker' },
        { status: 'Delivered to Amazon', date: order.deliveredToAmazonDate ? new Date(order.deliveredToAmazonDate).toLocaleDateString() : 'N/A', icon: 'pi pi-box' },
        { status: 'Available in Amazon', date: order.availableInAmazonDate ? new Date(order.availableInAmazonDate).toLocaleDateString() : 'N/A', icon: 'pi pi-check-circle' },
        { status: 'Coverage End', date: order.coverageDate ? new Date(order.coverageDate).toLocaleDateString() : 'N/A', icon: 'pi pi-calendar-times' },
    ];

    const filteredEvents = events.filter(event => event.date !== 'N/A');

    return (
        <div className="grid order-details-page">
            {/* Order Overview Section */}
            <div className="col-12">
                <Card title={`Order ID: ${order.orderId}`}>
                    <p>Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</p>
                    <p>Total Cost: ${order.totalCost}</p>
                    <p>Deposit: ${order.deposit}</p>
                    {/* Add more fields as needed */}
                    <Button label="Edit Order" icon="pi pi-pencil" onClick={openEditModal} />
                </Card>
            </div>

            {/* Order Timeline Section */}
            <div className="col-12">
                <Card title="Order Timeline">
                    <Timeline value={filteredEvents} align="alternate" className="customized-timeline" />
                </Card>
            </div>

            {/* Include the modal for editing the order */}
            {order && (
                <OrderEditModal
                    order={order}
                    setOrder={setOrder}
                    visible={editDialogVisible}
                    onHide={() => setEditDialogVisible(false)}
                    onSave={saveOrder}
                    submitted={submitted}
                />
            )}
        </div>
    );
};

export default OrderDetails;