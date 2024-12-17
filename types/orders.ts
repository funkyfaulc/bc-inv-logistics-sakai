import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp
import { Product } from './products'; // Adjust the import path if necessary
import { Dispatch, SetStateAction } from 'react'; // Import Dispatch and SetStateAction from react

export interface ShipmentItem {
    sku: string; // Reference to SKU from products collection
    unitCount: number; // Number of units for this SKU
}

export interface Shipment {
    shipmentId: string;
    destination: string;
    cartons: number;
    cbm: number;
    weight: number;
    amazonShipmentId: string;
    amazonReference: string;
    giHbl: string;
    giQuote: string;
    insurance: number;
    items: ShipmentItem[]; // Items are part of shipments
    boats: string;
    departureDate: Date | null;
    arrivalDate: Date | null;
}

export interface Order {
    id?: string;
    orderId: string;
    orderDate?: Date | null;
    finalCountDate?: Date | null;
    finishManufactureDate?: Date | null;
    leavePortDate?: Date | null;
    arrivePortDate?: Date | null;
    deliveredToAmazonDate?: Date | null;
    availableInAmazonDate?: Date | null;
    coverageDate?: Date | null;
    contract?: string;
    deposit?: number;
    totalCost?: number;
    shipments?: Shipment[]; // Shipments are associated with the order
}

export interface OrderEditModalProps {
    order: Order | null;
    setOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    visible: boolean;
    onHide: () => void;
    onSave: () => Promise<void>;
    submitted: boolean;
}



export interface EventItem {
    status: string;
    date: Date | null;
    icon: string;
    color?: string;
    today?: boolean;
}

// Firestore-Specific Interfaces
export interface ShipmentItemFirestore {
    sku: string;
    unitCount: number;
}

export interface ShipmentFirestore {
    shipmentId: string;
    destination: string;
    cartons: number;
    cbm: number;
    weight: number;
    amazonShipmentId: string;
    amazonReference: string;
    giHbl: string;
    giQuote: string;
    insurance: number;
    items: ShipmentItemFirestore[];
    boats: string;
    departureDate: Timestamp | null;
    arrivalDate: Timestamp | null;
}

export interface OrderFirestore {
    orderId: string;
    orderDate: Timestamp | null;
    finalCountDate: Timestamp | null;
    finishManufactureDate: Timestamp | null;
    leavePortDate: Timestamp | null;
    arrivePortDate: Timestamp | null;
    deliveredToAmazonDate: Timestamp | null;
    availableInAmazonDate: Timestamp | null;
    coverageDate: Timestamp | null;
    contract: string;
    deposit: number;
    totalCost: number;
    created_at: Timestamp;
    updated_at: Timestamp;
    shipments: ShipmentFirestore[];
}

export interface OrderItem {
    sku: string; // Reference to SKU
    totalUnitCount: number; // Total units for this SKU in the order
    totalCartonCount: number; // Total cartons for this SKU in the order
}

export interface OrderItemFirestore {
    sku: string;
    totalUnitCount: number;
    totalCartonCount: number;
}
