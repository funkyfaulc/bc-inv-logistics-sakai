import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

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

interface OrderEditModalProps {
    order: Order;
    setOrder: React.Dispatch<React.SetStateAction<Order>>;
    visible: boolean;
    onHide: () => void;
    onSave: () => Promise<void>;
    submitted: boolean;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, setOrder, visible, onHide, onSave, submitted }) => {
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLInputElement>, name: string) => {
        const val = e.target.value;
        let _order = { ...order };

        if (['orderDate', 'finalCountDate', 'finishManufactureDate', 'leavePortDate', 'arrivePortDate', 'deliveredToAmazonDate', 'availableInAmazonDate', 'coverageDate'].includes(name)) {
            _order[name] = e.target.value ? new Date(e.target.value) : null;
        } else {
            _order[name] = val;
        }

        setOrder(_order);
    };

    return (
        <Dialog visible={visible} style={{ width: '450px' }} header="Order Details" modal onHide={onHide}>
            <div className="field">
                <label htmlFor="orderId">Order ID</label>
                <InputText
                    id="orderId"
                    value={order.orderId}
                    onChange={(e) => onInputChange(e as any, 'orderId')}
                    className={classNames({ 'p-invalid': submitted && !order.orderId })}
                    disabled={!!order.id}
                />
                {submitted && !order.orderId && <small className="p-invalid">Order ID is required.</small>}
            </div>

            <div className="field">
                <label htmlFor="orderDate">Order Date</label>
                <Calendar id="orderDate" value={order.orderDate} onChange={(e) => onInputChange(e as any, 'orderDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="finalCountDate">Final Count Date</label>
                <Calendar id="finalCountDate" value={order.finalCountDate} onChange={(e) => onInputChange(e as any, 'finalCountDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="finishManufactureDate">Finish Manufacture Date</label>
                <Calendar id="finishManufactureDate" value={order.finishManufactureDate} onChange={(e) => onInputChange(e as any, 'finishManufactureDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="leavePortDate">Leave Port Date</label>
                <Calendar id="leavePortDate" value={order.leavePortDate} onChange={(e) => onInputChange(e as any, 'leavePortDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="arrivePortDate">Arrive Port Date</label>
                <Calendar id="arrivePortDate" value={order.arrivePortDate} onChange={(e) => onInputChange(e as any, 'arrivePortDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="deliveredToAmazonDate">Delivered to Amazon Date</label>
                <Calendar id="deliveredToAmazonDate" value={order.deliveredToAmazonDate} onChange={(e) => onInputChange(e as any, 'deliveredToAmazonDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="availableInAmazonDate">Available in Amazon Date</label>
                <Calendar id="availableInAmazonDate" value={order.availableInAmazonDate} onChange={(e) => onInputChange(e as any, 'availableInAmazonDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="coverageDate">Coverage Date</label>
                <Calendar id="coverageDate" value={order.coverageDate} onChange={(e) => onInputChange(e as any, 'coverageDate')} showIcon />
            </div>

            <div className="field">
                <label htmlFor="totalCost">Total Cost</label>
                <InputText id="totalCost" value={order.totalCost || ''} onChange={(e) => onInputChange(e as any, 'totalCost')} />
            </div>

            <div className="field">
                <label htmlFor="deposit">Deposit</label>
                <InputText id="deposit" value={order.deposit || ''} onChange={(e) => onInputChange(e as any, 'deposit')} />
            </div>

            <Button label="Save" onClick={onSave} />
        </Dialog>
    );
};

export default OrderEditModal;