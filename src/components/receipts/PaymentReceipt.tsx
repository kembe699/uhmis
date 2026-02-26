import React from 'react';
import { format } from 'date-fns';

interface PaymentReceiptProps {
  bill: {
    id: string;
    billNumber: string;
    patientName: string;
    patientId: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    billDate: string;
    services: Array<{
      id?: string;
      serviceName?: string;
      name?: string;
      service_name?: string;
      quantity?: number;
      unitPrice?: number;
      unit_price?: number;
      totalPrice?: number;
      total_price?: number;
      price?: number;
    }>;
  };
  payment: {
    amount: number;
    method: string;
    date: string;
    notes?: string;
    from_lease: boolean;
    lease_details?: string;
    cashierName?: string;
    cashierId?: string;
  };
  clinicName?: string;
  receiptNumber?: string;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  bill,
  payment,
  clinicName = "Medical Clinic",
  receiptNumber
}) => {
  const currentDate = new Date();
  const receiptId = receiptNumber || `RCP-${Date.now().toString().slice(-8)}`;

  return (
    <div className="thermal-receipt" style={{
      width: '100%',
      maxWidth: '302px', // 80mm = ~302px at 96dpi
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: '1.3',
      color: '#000',
      backgroundColor: '#fff',
      padding: '12px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>
          UNIVERSAL HOSPITAL
        </div>
        <div style={{ fontSize: '9px', marginBottom: '1px', color: '#666' }}>
          Hai Jerusalem, Juba, South Sudan
        </div>
        <div style={{ fontSize: '9px', marginBottom: '1px', color: '#666' }}>
          Tel: 0922123463
        </div>
        <div style={{ fontSize: '9px', marginBottom: '6px', color: '#666' }}>
          Email: info@universalhospital.com
        </div>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
          PAYMENT RECEIPT
        </div>
        <div style={{ fontSize: '10px' }}>
          {format(currentDate, 'dd/MM/yyyy HH:mm:ss')}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Receipt Info */}
      <div style={{ marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Receipt No:</span>
          <span style={{ fontWeight: 'bold' }}>{receiptId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Bill No:</span>
          <span>{bill.billNumber}</span>
        </div>
      </div>

      {/* Patient Info */}
      <div style={{ marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>PATIENT DETAILS:</div>
        <div>Name: {bill.patientName}</div>
        <div>ID: {bill.patientId}</div>
        <div>Bill Date: {format(new Date(bill.billDate), 'dd/MM/yyyy')}</div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Services */}
      <div style={{ marginBottom: '12px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SERVICES:</div>
        {bill.services && bill.services.length > 0 ? (
          bill.services.map((service, index) => (
            <div key={service.id || index} style={{ marginBottom: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ flex: 1, paddingRight: '4px' }}>
                  {service.serviceName || service.name || service.service_name || (service as any).test_name || 'Unknown Service'}
                </span>
                <span style={{ minWidth: '60px', textAlign: 'right' }}>
                  SSP {(service.totalPrice || service.total_price || service.price || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: '#666', paddingLeft: '4px' }}>
                {service.quantity || 1} x SSP {(service.unitPrice || service.unit_price || service.price || 0).toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '9px', color: '#666', fontStyle: 'italic' }}>
            No service details available
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Bill Summary */}
      <div style={{ marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Total Amount:</span>
          <span>SSP {bill.totalAmount?.toFixed(2) || '0.00'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Total Paid:</span>
          <span>SSP {bill.paidAmount?.toFixed(2) || '0.00'}</span>
        </div>
        <div style={{ borderTop: '1px solid #000', paddingTop: '2px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Balance Due:</span>
            <span>SSP {Math.max(0, (bill.totalAmount || 0) - (bill.paidAmount || 0)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '12px', fontSize: '11px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>PAYMENT DETAILS:</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Method:</span>
          <span style={{ textTransform: 'capitalize' }}>{payment.method}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{format(new Date(payment.date), 'dd/MM/yyyy')}</span>
        </div>
        {payment.from_lease && (
          <>
            <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '10px' }}>
              LEASE PAYMENT
            </div>
            {payment.lease_details && (
              <div style={{ fontSize: '9px', marginTop: '2px', wordWrap: 'break-word' }}>
                {payment.lease_details}
              </div>
            )}
          </>
        )}
        {payment.notes && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Notes:</div>
            <div style={{ fontSize: '9px', wordWrap: 'break-word' }}>
              {payment.notes}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Cashier Information */}
      {payment.cashierName && (
        <div style={{ marginBottom: '12px', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: 'bold' }}>RECEIVED BY:</span>
            <span style={{ fontWeight: 'bold' }}>{payment.cashierName}</span>
          </div>
          {payment.cashierId && (
            <div style={{ textAlign: 'right', fontSize: '9px', color: '#666' }}>
              ID: {payment.cashierId}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '12px' }}>
        <div style={{ marginBottom: '4px' }}>
          Thank you for your payment!
        </div>
        <div style={{ fontSize: '9px', color: '#666' }}>
          Keep this receipt for your records
        </div>
        {bill.balanceAmount > 0 && (
          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
            Outstanding balance: SSP {bill.balanceAmount?.toFixed(2) || '0.00'}
          </div>
        )}
      </div>

      {/* Bottom spacing for tear-off */}
      <div style={{ height: '20px' }}></div>
    </div>
  );
};

// Print function for thermal receipt
export const printThermalReceipt = (receiptElement: HTMLElement) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the receipt');
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
          }
          .thermal-receipt {
            width: 80mm !important;
            max-width: none !important;
          }
        }
        body {
          margin: 0;
          padding: 8px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      ${receiptElement.outerHTML}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
};
