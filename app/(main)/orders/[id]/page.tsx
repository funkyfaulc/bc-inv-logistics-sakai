// app/(main)/orders/[id]/page.tsx

'use client';
import { useParams } from 'next/navigation';  
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { OrderService } from '@/demo/services/OrderService';
import { Timeline } from 'primereact/timeline';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext'; // for shipment dialog input fields
import { Accordion, AccordionTab } from 'primereact/accordion'; // Import accordion for collapsible panels
import { Dropdown } from 'primereact/dropdown'; // If using Dropdown for boats
import { Calendar } from 'primereact/calendar'; // Import Calendar component for date selection
import { AutoComplete } from 'primereact/autocomplete';
import { CSVReader } from 'react-papaparse';



import OrderEditModal from '@/app/(main)/orders/modal/OrderEditModal';  // Ensure the path is correct

// Import centralized interfaces
import { Order, Shipment, ShipmentItem, EventItem } from '@/types/orders'; // Adjust the path as needed

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);  // Control modal visibility
    const [isShipmentDialogVisible, setIsShipmentDialogVisible] = useState(false);  // Shipment dialog visibility
    const [submitted, setSubmitted] = useState(false);
    const [editMode, setEditMode] = useState(false);  // Track whether we are editing
    const [editedShipmentIndex, setEditedShipmentIndex] = useState<number | null>(null);  // Track the index of the shipment being edited
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
        items: [], // Initialize as empty array
        boats: '', // Initialize as empty string
        departureDate: null, // Initialize new fields
        arrivalDate: null,   // Initialize new fields
    });

    useEffect(() => {
        if (id) {
            OrderService.getOrderById(id).then((data) => {
                // Ensure all shipments have the boats field
                if (data && data.shipments) {
                    const updatedShipments = data.shipments.map(shipment => ({
                        ...shipment,
                        boats: shipment.boats || [], // Default to empty array if undefined
                    }));
                    setOrder({ ...data, shipments: updatedShipments });
                } else {
                    setOrder(data);
                }
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

    const openShipmentDialog = () => {
        setEditMode(false); // Reset edit mode for adding new shipment
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
            boats: []
        });
        setIsShipmentDialogVisible(true);
    };

    // Edit Shipment
    const openEditShipment = (shipment: Shipment, index: number) => {
        setEditMode(true);  // Set edit mode to true
        setEditedShipmentIndex(index); // Keep track of the shipment being edited
        setNewShipment(shipment);  // Pre-fill the dialog with the shipment details
        setIsShipmentDialogVisible(true);  // Open the shipment dialog
    };

    const closeShipmentDialog = () => {
        setIsShipmentDialogVisible(false);  // Close shipment dialog
    };

    const saveOrder = async () => {
        setSubmitted(true);
        if (order && order.id) {
            await OrderService.updateOrder(order.id, order);
            setIsEditModalVisible(false);
            setSubmitted(false);
        }
    };

    const saveShipment = async () => {
        console.log("saveShipment called!"); // Verify the function is being triggered

        if (order) {
            let updatedShipments = [...(order.shipments || [])];

            // Ensure that newShipment is valid
            if (editMode && editedShipmentIndex !== null) {
                if (newShipment && editedShipmentIndex >= 0 && editedShipmentIndex < updatedShipments.length) {
                    updatedShipments[editedShipmentIndex] = { ...newShipment };  // Update existing shipment
                }
            } else {
                // Add new shipment only if it's valid
                if (newShipment && newShipment.shipmentId && newShipment.amazonShipmentId) {
                    updatedShipments = [...updatedShipments, { ...newShipment }]; // Add new shipment
                }
            }

            const updatedOrder = { ...order, shipments: updatedShipments };

            // Log new shipment data
            console.log('New Shipment Data:', newShipment);

            // Log to check if updatedOrder contains the correct shipment data
            console.log('Updated Order with shipments:', updatedOrder);

            setOrder(updatedOrder);

            await OrderService.updateOrder(order.id, updatedOrder);  // Update Firestore

            // Reset shipment and dialog state
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
                boats: []
            });

            setIsShipmentDialogVisible(false);  // Close shipment dialog
            setEditMode(false);  // Reset edit mode
            setEditedShipmentIndex(null);   // Reset edited shipment index
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
                                    <p><strong>Boats:</strong> {shipment.boats?.join(', ') || 'N/A'}</p>
                                    <Button label="Edit Shipment" icon="pi pi-pencil" onClick={() => openEditShipment(shipment, index)} />
                                </div>
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
            <Dialog header={editMode ? 'Edit Shipment' : 'Add Shipment'} modal className="Add Shipment" visible={isShipmentDialogVisible} onHide={closeShipmentDialog}> 
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
                        style={{ width: '250px' }} // Adjust the width as needed
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

                 {/*Fields for Gi HBL and Gi Quote */}
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
                  
                {/* New Boat Name Field */}
                <div className="field">
                    <label htmlFor="boatName">Boat Name</label>
                    <InputText
                        id="boatName"
                        value={newShipment.boats}
                        onChange={(e) => setNewShipment({ ...newShipment, boats: e.target.value })}
                        placeholder="Enter Boat Name"
                        required
                    />
                </div>        


                  {/* New Fields for Departure and Arrival Dates */}
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
                

                {/* Assign Boats Section REMOVED 09302024 */}
      

                {/* Items Section */}
                <div className="field">
                    <label>Items</label>
                    {newShipment.items.map((item, index) => (
                        <div key={index} className="p-grid p-fluid">
                            <div className="p-col-6">
                                <InputText
                                    value={item.sku}
                                    onChange={(e) => {
                                        const updatedItems = [...newShipment.items];
                                        updatedItems[index].sku = e.target.value;
                                        setNewShipment({ ...newShipment, items: updatedItems });
                                    }}
                                    placeholder="Enter SKU"
                                    required
                                />
                            </div>
                            <div className="p-col-4">
                                <InputText
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
                                    placeholder="Unit Count"
                                    required
                                />
                            </div>
                            <div className="p-col-2">
                                <Button 
                                    label="Remove" 
                                    icon="pi pi-times" 
                                    className="p-button-danger" 
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

                <Button label="Save Shipment" icon="pi pi-check" onClick={saveShipment} />
            </Dialog>
        </div>
    );

};

export default OrderDetails;