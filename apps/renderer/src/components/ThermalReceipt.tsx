/**
 * Professional Thermal Receipt Component
 * Optimized for 80mm (3.15 inch) thermal POS printers
 * Standard in retail shops for home appliances and electronics
 */

import { ShieldCheck, Phone, MapPin, Hash } from 'lucide-react';

interface ThermalReceiptProps {
  sale: any;
  settings: any;
}

export function ThermalReceipt({ sale, settings }: ThermalReceiptProps) {
  const fmt = (n: number) => `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  const shopName = settings?.shop_name || 'Home Appliances Shop';
  const shopAddress = settings?.shop_address || '';
  const shopPhone = settings?.shop_phone || '';
  const footer = settings?.receipt_footer || 'Thank you for your purchase!';
  const taxId = settings?.tax_id || '';

  const saleDate = new Date(sale.createdAt).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="thermal-receipt" style={{ width: '302px', fontFamily: 'monospace', fontSize: '11px', padding: '8px', backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>{shopName}</div>
        {shopAddress && <div style={{ fontSize: '9px', marginBottom: '1px' }}>{shopAddress}</div>}
        {shopPhone && <div style={{ fontSize: '9px', marginBottom: '1px' }}>Tel: {shopPhone}</div>}
        {taxId && <div style={{ fontSize: '9px' }}>Tax ID: {taxId}</div>}
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '6px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontWeight: 'bold' }}>Invoice:</span>
          <span>{sale.invoiceNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontWeight: 'bold' }}>Date:</span>
          <span>{saleDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontWeight: 'bold' }}>Cashier:</span>
          <span>{sale.cashier?.fullName || 'N/A'}</span>
        </div>
        {sale.customer && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontWeight: 'bold' }}>Customer:</span>
              <span>{sale.customer.name}</span>
            </div>
            {sale.customer.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 'bold' }}>Phone:</span>
                <span>{sale.customer.phone}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: '6px' }}>
        {sale.items?.map((item: any, idx: number) => (
          <div key={item.id} style={{ marginBottom: '8px', fontSize: '10px' }}>
            {/* Product Name */}
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{item.product?.name}</div>
            
            {/* SKU and Brand */}
            <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>
              SKU: {item.product?.sku}
              {item.product?.brand?.name && ` | ${item.product.brand.name}`}
            </div>

            {/* Serial Number */}
            {item.serialNumber && (
              <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>
                S/N: {item.serialNumber}
              </div>
            )}

            {/* Warranty Badge */}
            {item.warrantyMonths > 0 && (
              <div style={{ fontSize: '8px', color: '#059669', marginBottom: '2px' }}>
                ★ WARRANTY: {item.warrantyMonths} MONTHS ★
              </div>
            )}

            {/* Price Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>{item.quantity} x {fmt(item.unitPrice)}</span>
              {item.discount > 0 && <span style={{ color: '#dc2626' }}>-{fmt(item.discount)}</span>}
              <span style={{ fontWeight: 'bold' }}>{fmt(item.total)}</span>
            </div>

            {idx < sale.items.length - 1 && <div style={{ borderBottom: '1px dotted #ddd', marginTop: '6px' }} />}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal:</span>
          <span>{fmt(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#dc2626' }}>
            <span>Discount:</span>
            <span>-{fmt(sale.discount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Tax ({sale.tax}%):</span>
            <span>{fmt(sale.taxAmount)}</span>
          </div>
        )}
        <div style={{ borderTop: '2px solid #000', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
          <span>TOTAL:</span>
          <span>{fmt(sale.total)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '8px', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Payment Method:</span>
          <span style={{ fontWeight: 'bold' }}>{sale.paymentMethod?.replace('_', ' ')}</span>
        </div>
        {sale.paymentMethod === 'CASH' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Amount Paid:</span>
              <span>{fmt(sale.amountPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Change:</span>
              <span>{fmt(sale.changeGiven)}</span>
            </div>
          </>
        )}
      </div>

      {/* Warranty Information */}
      {sale.items?.some((i: any) => i.warrantyMonths > 0) && (
        <div style={{ marginBottom: '8px', fontSize: '9px', border: '1px solid #059669', padding: '4px', borderRadius: '3px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', textAlign: 'center' }}>★ WARRANTY DETAILS ★</div>
          {sale.items
            .filter((i: any) => i.warrantyMonths > 0)
            .map((i: any) => {
              const warrantyExpiry = new Date(sale.createdAt);
              warrantyExpiry.setMonth(warrantyExpiry.getMonth() + i.warrantyMonths);
              return (
                <div key={i.id} style={{ marginBottom: '2px' }}>
                  <div>{i.product?.name}</div>
                  <div>Valid until: {warrantyExpiry.toLocaleDateString('en-PK')}</div>
                  {i.serialNumber && <div>S/N: {i.serialNumber}</div>}
                </div>
              );
            })}
          <div style={{ marginTop: '4px', fontSize: '8px', textAlign: 'center', fontStyle: 'italic' }}>
            Keep this receipt for warranty claims
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '2px dashed #000', paddingTop: '6px', marginTop: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>{footer}</div>
        <div style={{ fontSize: '8px', marginBottom: '2px' }}>Visit us again!</div>
        <div style={{ fontSize: '8px', marginTop: '6px' }}>*** Thank You ***</div>
      </div>

      {/* Barcode/QR Code Placeholder */}
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '8px' }}>
        Invoice: {sale.invoiceNumber}
      </div>
    </div>
  );
}

/**
 * Generate HTML for thermal receipt printing
 * Optimized for 80mm (302px at 96 DPI) thermal printers
 */
export function generateThermalReceiptHTML(sale: any, settings: any): string {
  const fmt = (n: number) => `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  const shopName = settings?.shop_name || 'Home Appliances Shop';
  const shopAddress = settings?.shop_address || '';
  const shopPhone = settings?.shop_phone || '';
  const footer = settings?.receipt_footer || 'Thank you for your purchase!';
  const taxId = settings?.tax_id || '';

  const saleDate = new Date(sale.createdAt).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let itemsHTML = '';
  sale.items?.forEach((item: any, idx: number) => {
    const warrantyHTML = item.warrantyMonths > 0 
      ? `<div style="font-size: 8px; margin: 2px 0; color: #059669;">★ WARRANTY: ${item.warrantyMonths} MONTHS ★</div>`
      : '';
    
    const serialHTML = item.serialNumber 
      ? `<div style="font-size: 9px; color: #666; margin: 2px 0;">S/N: ${item.serialNumber}</div>`
      : '';

    const discountHTML = item.discount > 0 
      ? `<span style="color: #dc2626;">-${fmt(item.discount)}</span>`
      : '';

    itemsHTML += `
      <div style="margin-bottom: 8px; font-size: 10px;">
        <div style="font-weight: bold; margin-bottom: 2px;">${item.product?.name}</div>
        <div style="font-size: 9px; color: #666; margin-bottom: 2px;">SKU: ${item.product?.sku}${item.product?.brand?.name ? ' | ' + item.product.brand.name : ''}</div>
        ${serialHTML}
        ${warrantyHTML}
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>${item.quantity} x ${fmt(item.unitPrice)}</span>
          ${discountHTML}
          <span style="font-weight: bold;">${fmt(item.total)}</span>
        </div>
        ${idx < sale.items.length - 1 ? '<div style="border-bottom: 1px dotted #ddd; margin-top: 6px;"></div>' : ''}
      </div>
    `;
  });

  const warrantyItems = sale.items?.filter((i: any) => i.warrantyMonths > 0) || [];
  let warrantyHTML = '';
  if (warrantyItems.length > 0) {
    let warrantyDetailsHTML = '';
    warrantyItems.forEach((i: any) => {
      const warrantyExpiry = new Date(sale.createdAt);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + i.warrantyMonths);
      warrantyDetailsHTML += `
        <div style="margin-bottom: 2px;">
          <div>${i.product?.name}</div>
          <div>Valid until: ${warrantyExpiry.toLocaleDateString('en-PK')}</div>
          ${i.serialNumber ? `<div>S/N: ${i.serialNumber}</div>` : ''}
        </div>
      `;
    });

    warrantyHTML = `
      <div style="margin-bottom: 8px; font-size: 9px; border: 1px solid #059669; padding: 4px; border-radius: 3px;">
        <div style="font-weight: bold; margin-bottom: 3px; text-align: center;">★ WARRANTY DETAILS ★</div>
        ${warrantyDetailsHTML}
        <div style="margin-top: 4px; font-size: 8px; text-align: center; font-style: italic;">Keep this receipt for warranty claims</div>
      </div>
    `;
  }

  const customerHTML = sale.customer ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span style="font-weight: bold;">Customer:</span>
      <span>${sale.customer.name}</span>
    </div>
    ${sale.customer.phone ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span style="font-weight: bold;">Phone:</span>
      <span>${sale.customer.phone}</span>
    </div>` : ''}
  ` : '';

  const discountRowHTML = sale.discount > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #dc2626;">
      <span>Discount:</span>
      <span>-${fmt(sale.discount)}</span>
    </div>
  ` : '';

  const taxRowHTML = sale.taxAmount > 0 ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
      <span>Tax (${sale.tax}%):</span>
      <span>${fmt(sale.taxAmount)}</span>
    </div>
  ` : '';

  const cashPaymentHTML = sale.paymentMethod === 'CASH' ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>Amount Paid:</span>
      <span>${fmt(sale.amountPaid)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-weight: bold;">
      <span>Change:</span>
      <span>${fmt(sale.changeGiven)}</span>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${sale.invoiceNumber}</title>
  <style>
    @page { 
      size: 80mm auto; 
      margin: 0mm;
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      width: 80mm;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 4mm;
      background: #fff;
      color: #000;
    }
    @media print { 
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div style="width: 302px; font-family: monospace; font-size: 11px; padding: 8px; background-color: #fff;">
    <!-- Header -->
    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${shopName}</div>
      ${shopAddress ? `<div style="font-size: 9px; margin-bottom: 1px;">${shopAddress}</div>` : ''}
      ${shopPhone ? `<div style="font-size: 9px; margin-bottom: 1px;">Tel: ${shopPhone}</div>` : ''}
      ${taxId ? `<div style="font-size: 9px;">Tax ID: ${taxId}</div>` : ''}
    </div>

    <!-- Invoice Info -->
    <div style="margin-bottom: 6px; font-size: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="font-weight: bold;">Invoice:</span>
        <span>${sale.invoiceNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="font-weight: bold;">Date:</span>
        <span>${saleDate}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="font-weight: bold;">Cashier:</span>
        <span>${sale.cashier?.fullName || 'N/A'}</span>
      </div>
      ${customerHTML}
    </div>

    <!-- Items -->
    <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 6px;">
      ${itemsHTML}
    </div>

    <!-- Totals -->
    <div style="margin-bottom: 8px; font-size: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span>Subtotal:</span>
        <span>${fmt(sale.subtotal)}</span>
      </div>
      ${discountRowHTML}
      ${taxRowHTML}
      <div style="border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
        <span>TOTAL:</span>
        <span>${fmt(sale.total)}</span>
      </div>
    </div>

    <!-- Payment Details -->
    <div style="margin-bottom: 8px; font-size: 10px; border-top: 1px dashed #000; padding-top: 6px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Payment Method:</span>
        <span style="font-weight: bold;">${sale.paymentMethod?.replace('_', ' ')}</span>
      </div>
      ${cashPaymentHTML}
    </div>

    <!-- Warranty Information -->
    ${warrantyHTML}

    <!-- Footer -->
    <div style="text-align: center; border-top: 2px dashed #000; padding-top: 6px; margin-top: 8px;">
      <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">${footer}</div>
      <div style="font-size: 8px; margin-bottom: 2px;">Visit us again!</div>
      <div style="font-size: 8px; margin-top: 6px;">*** Thank You ***</div>
    </div>

    <!-- Invoice Reference -->
    <div style="text-align: center; margin-top: 8px; font-size: 8px;">
      Invoice: ${sale.invoiceNumber}
    </div>
  </div>
</body>
</html>
  `.trim();
}
