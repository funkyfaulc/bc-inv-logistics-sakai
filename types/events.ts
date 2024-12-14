import { SyntheticEvent } from 'react';
import { Order } from './orders';

export interface CalendarChangeEvent {
    originalEvent: React.SyntheticEvent;
    value: Date | Date[] | null;
    target: {
        name?: string;
        id?: string;
        value: Date | Date[] | null;
    };
}

export interface InputChangeEvent {
    target?: {
        value: string | Date | null;
    };
    value?: Date | null;
}

export type OrderInputEvent = InputChangeEvent | CalendarChangeEvent;

export type OrderDateKey = keyof Pick<Order, 'orderDate' | 'finalCountDate' | 'finishManufactureDate' | 'leavePortDate' | 'arrivePortDate' | 'deliveredToAmazonDate' | 'availableInAmazonDate' | 'coverageDate'>;
