// bc-inv-logistics-sakai/types/orders.ts

import { Timestamp } from 'firebase/firestore'; // Import Firestore Timestamp


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
    items: ShipmentItem[]; // New field
    boats: string; // New field
    departureDate: Date | null; // New field
    arrivalDate: Date | null;   // New field
}

export interface Order {
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
    items: OrderItem[]; // New field to track total order items
    shipments?: Shipment[]; // Updated field
}

export interface EventItem {
    status: string;
    date: Date | null;
    icon: string;
    color?: string;
    today?: boolean;
}

// **New Firestore-Specific Interfaces**
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
    departureDate: Timestamp | null; // New field
    arrivalDate: Timestamp | null;   // New field
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
    items: OrderItemFirestore[]; // New field
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

export interface EventItem {
    status: string;
    date: Date | null;
    icon: string;
    color?: string;
    today?: boolean;
}

// Firestore-Specific Interfaces remain updated as shown above