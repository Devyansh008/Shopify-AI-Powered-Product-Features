import { describe, it, expect } from 'vitest';
import { parseOrderHistoryCSV, parseOrderRow } from '../src/data/parser';
import { loadOrderHistory } from '../src/data/loader';

describe('CSV Parser and Validator', () => {
  it('successfully loads and parses the provided 28-row dataset without errors', () => {
    const result = loadOrderHistory();

    expect(result.errors).toEqual([]);
    expect(result.totalRowsProcessed).toBe(28);
    expect(result.validRowCount).toBe(28);
    expect(result.invalidRowCount).toBe(0);
    expect(result.data).toHaveLength(28);
  });

  it('correctly parses line items with all 19 typed attributes', () => {
    const { data } = loadOrderHistory();
    const firstItem = data[0];

    expect(firstItem.orderId).toBe('#1047');
    expect(firstItem.lineItemId).toBe('LI-500052');
    expect(firstItem.orderDate).toBe('2025-05-06');
    expect(firstItem.customerId).toBe('C-10233');
    expect(firstItem.isRepeatCustomer).toBe(false);
    expect(firstItem.productId).toBe('P-1006');
    expect(firstItem.productTitle).toBe('Organic Cotton Tee');
    expect(firstItem.productCategory).toBe('Tops');
    expect(firstItem.variant).toBe('M / Black');
    expect(firstItem.quantity).toBe(2);
    expect(firstItem.unitPrice).toBe(28.0);
    expect(firstItem.discountAmount).toBe(0.0);
    expect(firstItem.lineTotal).toBe(56.0);
    expect(firstItem.salesChannel).toBe('Online Store');
    expect(firstItem.fulfillmentStatus).toBe('fulfilled');
    expect(firstItem.returned).toBe(false);
    expect(firstItem.returnDate).toBeNull();
    expect(firstItem.returnReason).toBeNull();
    expect(firstItem.refundAmount).toBeNull();
  });

  it('correctly handles returned items and their missing vs present fields', () => {
    const { data } = loadOrderHistory();
    // Row 4: order #1188, Harbor Rain Shell, returned = true
    const returnedItem = data.find((item) => item.orderId === '#1188')!;

    expect(returnedItem.returned).toBe(true);
    expect(returnedItem.returnDate).toBe('2025-07-08');
    expect(returnedItem.returnReason).toBe('Not as pictured');
    expect(returnedItem.refundAmount).toBe(94.0);
  });

  it('gracefully captures validation errors on malformed rows', () => {
    const malformedCSV = `order_id,line_item_id,order_date,customer_id,quantity,unit_price
#9999,LI-1,2025-10-01,C-1,not-a-number,10.00
,LI-2,2025-10-01,C-2,1,10.00
#9999,LI-3,invalid-date,C-3,1,10.00`;

    const result = parseOrderHistoryCSV(malformedCSV);
    expect(result.data).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors[0]).toContain("Invalid 'quantity'");
    expect(result.errors[1]).toContain("Missing required field 'order_id'");
    expect(result.errors[2]).toContain("Invalid 'order_date'");
  });
});
