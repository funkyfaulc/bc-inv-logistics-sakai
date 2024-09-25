'use client';
import { useParams, useRouter } from 'next/navigation';  
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
    const router = useRouter();
    const { id } = useParams();
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
        setEditDialogVisible(true);
    };

    const saveOrder = async () => {
        setSubmitted(true);
        if (order && order.orderId) {
            await OrderService.updateOrder(order.id as string, order);
            setEditDialogVisible(false);
            setSubmitted(false);
        }
    };

    if (loading) return <p>Loading Order Details...</p>;
    if (!order) return <p>Order not found</p>;

    // Mapping the timeline events with dates and appropriate icons
    const events = [
        { status: 'Order Placed', date: order.orderDate, icon: 'pi pi-shopping-cart', color: '#007bff' },
        { status: 'Final Count', date: order.finalCountDate, icon: 'pi pi-check', color: '#28a745' },
        { status: 'Manufacturing Complete', date: order.finishManufactureDate, icon: 'pi pi-cog', color: '#17a2b8' },
        { status: 'Left Port', date: order.leavePortDate, icon: 'pi pi-send', color: '#ffc107' },
        { status: 'Arrived at Destination', date: order.arrivePortDate, icon: 'pi pi-map-marker', color: '#dc3545' },
        { status: 'Delivered to Amazon', date: order.deliveredToAmazonDate, icon: 'pi pi-box', color: '#6f42c1' },
        { status: 'Available in Amazon', date: order.availableInAmazonDate, icon: 'pi pi-check-circle', color: '#20c997' },
        { status: 'Coverage End', date: order.coverageDate, icon: 'pi pi-calendar-times', color: '#343a40' },
    ];

    // Only show events that have a valid date
    const filteredEvents = events.filter(event => event.date);

    return (
        <div className="grid order-details-page">
            {/* Order Overview Section */}
            <div className="col-12">
                <Card title={`Order ID: ${order.orderId}`}>
                    <p>Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</p>
                    <p>Total Cost: ${order.totalCost}</p>
                    <p>Deposit: ${order.deposit}</p>
                    <Button label="Edit Order" icon="pi pi-pencil" onClick={openEditModal} />
                </Card>
            </div>

            {/* Order Timeline Section */}
            <div className="col-12">
                <Card title="Order Timeline">
                    <Timeline 
                        value={filteredEvents} 
                        align="alternate" 
                        className="customized-timeline"
                        marker={(item) => (
                            <i 
                                className={item.icon} 
                                style={{ fontSize: '1.5em', color: item.color }} 
                            ></i>
                        )}
                        content={(item) => (
                            <p>
                                <strong>{item.status}</strong><br />
                                {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                            </p>
                        )}
                    />
                </Card>
            </div>

            <OrderEditModal
                order={order}
                setOrder={setOrder}
                visible={editDialogVisible}
                onHide={() => setEditDialogVisible(false)}
                onSave={saveOrder}
                submitted={submitted}
            />
        </div>
    );
};

export default OrderDetails;