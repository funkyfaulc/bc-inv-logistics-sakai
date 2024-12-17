//bc-inventory-logistics-app/bc-inv-logistics-sakai/app/(main)/orders/modal/OrderEditModal.tsx

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Suspense } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Order, OrderEditModalProps } from '@/types/orders';
import { Timestamp } from 'firebase/firestore';

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  setOrder,
  visible,
  onHide,
  onSave,
  submitted,
}) => {
  // Handlers for different types of inputs
  const handleStringInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Order
  ) => {
    const val = e.target.value;
    setOrder((prevOrder) => ({
      ...prevOrder,
      [field]: val || '',
    } as Order));
  };

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Order
  ) => {
    const val = parseFloat(e.target.value) || 0;
    setOrder((prevOrder) => ({
      ...prevOrder,
      [field]: val as any,
    } as Order));
  };

  const handleDateInputChange = (
    e: any,
    field: keyof Order
  ) => {
    const date = e.value ? Timestamp.fromDate(new Date(e.value)) : null;
    setOrder((prevOrder) => ({
      ...prevOrder,
      [field]: date || null,
    } as Order));
  };

  // Render the component
  return (
    <Dialog
      visible={visible}
      style={{ width: '450px' }}
      header="Order Details"
      modal
      onHide={onHide}
    >
      <div className="field">
        <label htmlFor="orderId">Order ID</label>
        <InputText
          id="orderId"
          value={order?.orderId || ''}
          onChange={(e) => handleStringInputChange(e, 'orderId')}
          className={classNames({ 'p-invalid': submitted && !order?.orderId })}
          disabled={!!order?.id}
        />
        {submitted && !order?.orderId && (
          <small className="p-invalid">Order ID is required.</small>
        )}
      </div>

      <div className="field">
        <label htmlFor="coverageDate">Coverage Date</label>
        <Calendar
          id="coverageDate"
          value={order?.coverageDate}
          onChange={(e) => handleDateInputChange(e, 'coverageDate')}
          showIcon
        />
      </div>

      <div className="field">
        <label htmlFor="totalCost">Total Cost</label>
        <InputText
          id="totalCost"
          value={order?.totalCost?.toString() || ''}
          onChange={(e) => handleNumberInputChange(e, 'totalCost')}
        />
      </div>

      <div className="field">
        <label htmlFor="deposit">Deposit</label>
        <InputText
          id="deposit"
          value={order?.deposit?.toString() || ''}
          onChange={(e) => handleNumberInputChange(e, 'deposit')}
        />
      </div>

      {/* Add more fields as needed */}

      <Button label="Save" onClick={onSave} />
    </Dialog>
  );
};

export default OrderEditModal;