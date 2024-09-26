'use client';
import { useParams } from 'next/navigation';  
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { OrderService } from '@/demo/service/OrderService';
import { Timeline } from 'primereact/timeline';
import OrderEditModal from '@/app/(main)/orders/modal/OrderEditModal';  // Ensure the path is correct

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

interface EventItem {
    status: string;
    date: Date | null;
    icon: string;
    color?: string;
    today?: boolean;
}

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);  // Control modal visibility
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
        setIsEditModalVisible(true);  // Show the modal
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);  // Hide the modal
    };

    const saveOrder = async () => {
        setSubmitted(true);
        if (order && order.orderId) {
            await OrderService.updateOrder(order.id as string, order);
            setIsEditModalVisible(false);
            setSubmitted(false);
        }
    };

    if (loading) return <p>Loading Order Details...</p>;
    if (!order) return <p>Order not found</p>;

    // Define the timeline events
    const events: EventItem[] = [
        { status: 'Order Placed', date: order.orderDate, icon: 'pi pi-shopping-cart', color: '#007bff' },
        { status: 'Final Count', date: order.finalCountDate, icon: 'pi pi-check', color: '#28a745' },
        { status: 'Manufacturing Complete', date: order.finishManufactureDate, icon: 'pi pi-cog', color: '#ffc107' },
        { status: 'Left Port', date: order.leavePortDate, icon: 'pi pi-send', color: '#17a2b8' },
        { status: 'Arrived at Destination', date: order.arrivePortDate, icon: 'pi pi-map-marker', color: '#ff5733' },
        { status: 'Delivered to Amazon', date: order.deliveredToAmazonDate, icon: 'pi pi-box', color: '#6610f2' },
        { status: 'Available in Amazon', date: order.availableInAmazonDate, icon: 'pi pi-check-circle', color: '#28a745' },
        { status: 'Coverage End', date: order.coverageDate, icon: 'pi pi-calendar-times', color: '#dc3545' },
    ];

    const today = new Date();
    const todayMarker = { status: 'Today', date: today.toLocaleDateString(), icon: 'pi pi-calendar', color: 'red', today: true };

    const filteredEvents = [...events.filter(event => event.date !== 'N/A'), todayMarker].sort(
        (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );

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

            {/* Order Edit Modal */}
            <OrderEditModal
                order={order}
                setOrder={setOrder}
                visible={isEditModalVisible}
                onHide={closeEditModal}
                onSave={saveOrder}
                submitted={submitted}
            />
        </div>
    );
};

export default OrderDetails;