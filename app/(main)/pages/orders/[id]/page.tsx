'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { OrderService } from '../../../../demo/service/OrderService';
import { Timeline } from 'primereact/timeline';

const OrderDetails = () => {
    const router = useRouter();
    const { id } = router.query;  // Get the Order ID from URL parameters

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            OrderService.getOrderById(id).then((data) => {
                setOrder(data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return <p>Loading Order Details...</p>;
    }

    if (!order) {
        return <p>Order not found</p>;
    }

    const events = [
        { status: 'Order Placed', date: order.orderDate, icon: 'pi pi-shopping-cart' },
        { status: 'Final Count', date: order.finalCountDate, icon: 'pi pi-check' },
        { status: 'Manufacturing Complete', date: order.finishManufactureDate, icon: 'pi pi-cog' },
        { status: 'Left Port', date: order.leavePortDate, icon: 'pi pi-send' },
        { status: 'Arrived at Destination', date: order.arrivePortDate, icon: 'pi pi-map-marker' },
        { status: 'Delivered to Amazon', date: order.deliveredToAmazonDate, icon: 'pi pi-box' },
        { status: 'Available in Amazon', date: order.availableInAmazonDate, icon: 'pi pi-check-circle' },
        { status: 'Coverage End', date: order.coverageDate, icon: 'pi pi-calendar-times' },
    ];

    const filteredEvents = events.filter(event => event.date);

    return (
        <div className="grid order-details-page">
            {/* Order Overview Section */}
            <div className="col-12">
                <Card title={`Order ID: ${order.orderId}`}>
                    <p>Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</p>
                    <p>Total Cost: ${order.totalCost}</p>
                    <p>Deposit: ${order.deposit}</p>
                    {/* Add more fields as needed */}
                    <Button label="Edit Order" icon="pi pi-pencil" onClick={() => router.push(`/orders/edit/${order.id}`)} />
                </Card>
            </div>

            {/* Order Timeline Section */}
            <div className="col-12">
                <Card title="Order Timeline">
                    <Timeline value={filteredEvents} align="alternate" className="customized-timeline" />
                </Card>
            </div>

            {/* Placeholder for future sections */}
            {/* Product Details */}
            {/* Financial Details */}
        </div>
    );
};

export default OrderDetails;