// app/(main)/orders/[id]/page.tsx

'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import OrderEditModal from '@/app/(main)/orders/modal/OrderEditModal';

import { Order, Shipment, ShipmentItem, EventItem } from '@/types/orders';
import { Product } from '@/types/products';

import { OrderService } from '@/demo/services/OrderService';
import { ProductService } from '@/demo/services/ProductService'; // Ensure correct import

const OrderDetails = () => {
    const { id } = useParams() as { id: string }; //Expect id to be string
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isShipmentDialogVisible, setIsShipmentDialogVisible] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedShipmentIndex, setEditedShipmentIndex] = useState<number | null>(null);
    const [newShipment, setNewShipment] = useState<Shipment>({
        shipmentId: '',
        destination: '',
        cartons: 0,
        cbm: 0,
        weight: 0,
        amazonShipmentId: '',
        amazonReference: '',
        giHbl: '',
        giQuote: '',
        insurance: 0,
        items: [],
        boats: '',
        departureDate: null,
        arrivalDate: null,
    });

    const [products, setProducts] = useState<Product[]>([]); // State to hold products

    const toast = useRef<Toast>(null);

    // Fetch Order Details
    useEffect(() => {
        if (id) {
            OrderService.getOrderById(id).then((data) => {
                if (data && data.shipments) {
                    const updatedShipments = data.shipments.map(shipment => ({
                        ...shipment,
                        boats: shipment.boats || '', // Ensure boats is a string
                    }));
                    setOrder({ ...data, shipments: updatedShipments });
                } else {
                    setOrder(data);
                }
                setLoading(false);
            });
        }
    }, [id]);

    // Fetch Products for SKU Dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            const fetchedProducts = await ProductService.getProducts();
            setProducts(fetchedProducts);
        };
        fetchProducts();
    }, []);

    const openEditModal = () => {
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
    };

    const openShipmentDialog = () => {
        setEditMode(false);
        setNewShipment({
            shipmentId: '',
            destination: '',
            cartons: 0,
            cbm: 0,
            weight: 0,
            amazonShipmentId: '',
            amazonReference: '',
            giHbl: '',
            giQuote: '',
            insurance: 0,
            items: [],
            boats: '',
            departureDate: null,
            arrivalDate: null,
        });
        setIsShipmentDialogVisible(true);
    };

    const openEditShipment = (shipment: Shipment, index: number) => {
        setEditMode(true);
        setEditedShipmentIndex(index);
        setNewShipment(shipment);
        setIsShipmentDialogVisible(true);
    };

    const closeShipmentDialog = () => {
        setIsShipmentDialogVisible(false);
    };

    const saveOrder = async () => {
        setSubmitted(true);
        if (order && order.id) {
            await OrderService.updateOrder(order.id as string, order);
            setIsEditModalVisible(false);
            setSubmitted(false);
        }
    };

    const saveShipment = async () => {
        if (order && order.id) {
            let updatedShipments = [...(order.shipments || [])];

            if (editMode && editedShipmentIndex !== null) {
                if (newShipment && editedShipmentIndex >= 0 && editedShipmentIndex < updatedShipments.length) {
                    updatedShipments[editedShipmentIndex] = { ...newShipment };
                }
            } else {
                if (newShipment && newShipment.shipmentId && newShipment.amazonShipmentId) {
                    updatedShipments = [...updatedShipments, { ...newShipment }];
                }
            }

            const updatedOrder = { ...order, shipments: updatedShipments };

            setOrder(updatedOrder);

            try {
                await OrderService.updateOrder(order.id, updatedOrder);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: editMode ? 'Shipment Updated' : 'Shipment Added',
                    life: 3000
                });
            } catch (error) {
                console.error('Error saving shipment:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save shipment',
                    life: 3000
                });
            }

            setNewShipment({
                shipmentId: '',
                destination: '',
                cartons: 0,
                cbm: 0,
                weight: 0,
                amazonShipmentId: '',
                amazonReference: '',
                giHbl: '',
                giQuote: '',
                insurance: 0,
                items: [],
                boats: '',
                departureDate: null,
                arrivalDate: null,
            });

            setIsShipmentDialogVisible(false);
            setEditMode(false);
            setEditedShipmentIndex(null);
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

    const filteredEvents = [...events.filter(event => event.date !== null), todayMarker].sort(
        (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );

    return (
        <div className="grid order-details-page">
            {/* Order Overview Section */}
            <div className="col-12">
                <Card title={`Order ID: ${order.orderId}`}>
                    <p>Order Date: {order.orderDate ? order.orderDate.toLocaleDateString() : 'N/A'}</p>
                    <p>Total Cost: ${order.totalCost}</p>
                    <p>Deposit: ${order.deposit}</p>

                    {/* Edit Order Button */}
                    <Button label="Edit Order" icon="pi pi-pencil" onClick={openEditModal} />

                    {/* Add Shipment Button */}
                    <Button label="Add Shipment" icon="pi pi-plus" className="ml-2" onClick={openShipmentDialog} />
                </Card>
            </div>

            {/* Shipments Section */}
            <div className="col-12">
                {order.shipments && order.shipments.length > 0 ? (
                    <Accordion>
                        {order.shipments.map((shipment, index) => (
                            <AccordionTab key={index} header={`Shipment ${index + 1} - ${shipment.shipmentId}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                    <p><strong>AZ Shipment ID:</strong> {shipment.amazonShipmentId}</p>
                                    <p><strong>AZ Reference #:</strong> {shipment.amazonReference}</p>
                                    <p><strong>Cartons:</strong> {shipment.cartons}</p>
                                    <p><strong>CBM:</strong> {shipment.cbm}</p>
                                    <p><strong>Weight:</strong> {shipment.weight} KG</p>
                                    <p><strong>Guided Imports HBL:</strong> {shipment.giHbl}</p>
                                    <p><strong>Guided Imports Quote:</strong> {shipment.giQuote}</p>
                                    <p><strong>Insurance:</strong> ${shipment.insurance}</p>
                                    <p><strong>Boats:</strong> {shipment.boats || 'N/A'}</p>
                                    <Button label="Edit Shipment" icon="pi pi-pencil" onClick={() => openEditShipment(shipment, index)} />
                                </div>

                                {/* Display Shipment Items */}
                                {shipment.items && shipment.items.length > 0 ? (
                                    <div className="mt-3">
                                        <h5>Items:</h5>
                                        <DataTable value={shipment.items} paginator rows={5} responsiveLayout="scroll">
                                            <Column field="sku" header="SKU"></Column>
                                            <Column field="unitCount" header="Unit Count"></Column>
                                            {/* Add more columns if needed */}
                                        </DataTable>
                                    </div>
                                ) : (
                                    <p>No Items in this Shipment.</p>
                                )}
                            </AccordionTab>
                        ))}
                    </Accordion>
                ) : (
                    <p>No Shipments Yet</p>
                )}
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
                                {typeof item.date === 'string' ? item.date : item.date ? item.date.toLocaleDateString() : 'N/A'}
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

            {/* Shipment Dialog */}
            <Dialog
                header={editMode ? 'Edit Shipment' : 'Add Shipment'}
                modal
                className="Add Shipment"
                visible={isShipmentDialogVisible}
                onHide={closeShipmentDialog}
                style={{ width: '600px' }} // Increased width to accommodate items
            > 
                {/* Shipment Details */}
                <div className="field">
                    <label htmlFor="shipmentId">Shipment ID</label>
                    <InputText 
                        id="shipmentId" 
                        value={newShipment.shipmentId} 
                        onChange={(e) => setNewShipment({ ...newShipment, shipmentId: e.target.value })} 
                        required 
                    />
                </div>
                <div className="field">
                    <label htmlFor="amazonShipmentId">AZ Shipment ID</label>
                    <InputText 
                        id="amazonShipmentId" 
                        value={newShipment.amazonShipmentId} 
                        onChange={(e) => setNewShipment({ ...newShipment, amazonShipmentId: e.target.value })} 
                        required 
                        style={{ width: '250px' }}
                    />
                </div>
                <div className="field">
                    <label htmlFor="amazonReference">AZ Reference #</label>
                    <InputText 
                        id="amazonReference" 
                        value={newShipment.amazonReference} 
                        onChange={(e) => setNewShipment({ ...newShipment, amazonReference: e.target.value })} 
                        required 
                    />
                </div>
                <div className="field">
                    <label htmlFor="destination">Destination</label>
                    <InputText 
                        id="destination" 
                        value={newShipment.destination} 
                        onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })} 
                        required 
                    />
                </div>
                <div className="field">
                    <label htmlFor="cartons">Cartons</label>
                    <InputText 
                        id="cartons" 
                        value={newShipment.cartons} 
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value)) {
                                setNewShipment({ ...newShipment, cartons: value });
                            }
                        }} 
                        required 
                    />
                </div>
                <div className="field">
                    <label htmlFor="cbm">CBM</label>
                    <InputText 
                        id="cbm" 
                        value={newShipment.cbm} 
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                                setNewShipment({ ...newShipment, cbm: value });
                            }
                        }} 
                        required 
                    />
                </div>
                <div className="field">
                    <label htmlFor="weight">Weight (KG)</label>
                    <InputText 
                        id="weight" 
                        value={newShipment.weight} 
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                                setNewShipment({ ...newShipment, weight: value });
                            }
                        }} 
                        required 
                    />
                </div>

                {/* Fields for Gi HBL and Gi Quote */}
                <div className="field">
                    <label htmlFor="giHbl">Guided Imports HBL</label>
                    <InputText
                        id="giHbl"
                        value={newShipment.giHbl}
                        onChange={(e) => setNewShipment({ ...newShipment, giHbl: e.target.value })}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="giQuote">Guided Imports Quote</label>
                    <InputText
                        id="giQuote"
                        value={newShipment.giQuote}
                        onChange={(e) => setNewShipment({ ...newShipment, giQuote: e.target.value })}
                        required
                    />
                </div>
                
                {/* Boat Name Field */}
                <div className="field">
                    <label htmlFor="boats">Boat Name</label>
                    <InputText
                        id="boats"
                        value={newShipment.boats}
                        onChange={(e) => setNewShipment({ ...newShipment, boats: e.target.value })}
                        placeholder="Enter Boat Name"
                        required
                    />
                </div>        

                {/* Departure and Arrival Dates */}
                <div className="field">
                    <label htmlFor="departureDate">Departure Date</label>
                    <Calendar
                        id="departureDate"
                        value={newShipment.departureDate}
                        onChange={(e) => setNewShipment({ ...newShipment, departureDate: e.value })}
                        showIcon
                        dateFormat="mm/dd/yy"
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="arrivalDate">Arrival Date</label>
                    <Calendar
                        id="arrivalDate"
                        value={newShipment.arrivalDate}
                        onChange={(e) => setNewShipment({ ...newShipment, arrivalDate: e.value })}
                        showIcon
                        dateFormat="mm/dd/yy"
                        required
                    />
                </div>                

                {/* Items Section */}
                <div className="field">
                    <label>Items</label>
                    {newShipment.items.map((item, index) => (
                        <div key={index} className="p-grid p-fluid">
                            <div className="p-col-5">
                                <label htmlFor={`sku-${index}`}>SKU</label>
                                <Dropdown
                                    id={`sku-${index}`}
                                    value={item.sku}
                                    options={products.map(p => ({ label: p.sku, value: p.sku }))}
                                    onChange={(e) => {
                                        const updatedItems = [...newShipment.items];
                                        updatedItems[index].sku = e.value as string;
                                        setNewShipment({ ...newShipment, items: updatedItems });
                                    }}
                                    placeholder="Select SKU"
                                    required
                                />
                            </div>
                            <div className="p-col-5">
                                <label htmlFor={`unitCount-${index}`}>Unit Count</label>
                                <InputText
                                    id={`unitCount-${index}`}
                                    type="number"
                                    value={item.unitCount}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10);
                                        if (!isNaN(value)) {
                                            const updatedItems = [...newShipment.items];
                                            updatedItems[index].unitCount = value;
                                            setNewShipment({ ...newShipment, items: updatedItems });
                                        }
                                    }} 
                                    placeholder="Enter Unit Count"
                                    required
                                />
                            </div>
                            <div className="p-col-2">
                                <Button 
                                    label="Remove" 
                                    icon="pi pi-times" 
                                    className="p-button-danger p-mt-4" 
                                    onClick={() => {
                                        const updatedItems = newShipment.items.filter((_, i) => i !== index);
                                        setNewShipment({ ...newShipment, items: updatedItems });
                                    }} 
                                />
                            </div>
                        </div>
                    ))}
                    <Button 
                        label="Add Item" 
                        icon="pi pi-plus" 
                        onClick={() => {
                            setNewShipment({
                                ...newShipment,
                                items: [...newShipment.items, { sku: '', unitCount: 0 }],
                            });
                        }} 
                        className="p-mt-2" 
                    />
                </div>

                {/* Save Shipment Button */}
                <div className="p-d-flex p-jc-end p-mt-4">
                    <Button label="Save Shipment" icon="pi pi-check" onClick={saveShipment} />
                </div>
            </Dialog>
        </div>
    );

};

export default OrderDetails;