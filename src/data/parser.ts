/**
 * Robust CSV parser and validator for Shopify Order Line Items.
 * Handles type coercion, nullability for return fields, and error handling for malformed rows.
 */

import Papa from 'papaparse';
import { OrderLineItem, ParseResult, RawOrderRow } from '../types/order';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and converts a raw CSV row into a typed OrderLineItem.
 * Throws an Error with a descriptive message if required fields are missing or invalid.
 */
export function parseOrderRow(raw: RawOrderRow, rowIndex: number): OrderLineItem {
  const rowNum = rowIndex + 2; // Accounting for 1-based index and CSV header row

  // Required string identifiers
  const orderId = raw.order_id?.trim();
  if (!orderId) {
    throw new Error(`Row ${rowNum}: Missing required field 'order_id'.`);
  }

  const lineItemId = raw.line_item_id?.trim();
  if (!lineItemId) {
    throw new Error(`Row ${rowNum}: Missing required field 'line_item_id'.`);
  }

  const orderDate = raw.order_date?.trim();
  if (!orderDate || !ISO_DATE_REGEX.test(orderDate)) {
    throw new Error(
      `Row ${rowNum}: Invalid 'order_date' "${raw.order_date}". Expected YYYY-MM-DD.`
    );
  }

  const customerId = raw.customer_id?.trim();
  if (!customerId) {
    throw new Error(`Row ${rowNum}: Missing required field 'customer_id'.`);
  }

  // Boolean flags
  const isRepeatCustomer = raw.is_repeat_customer?.trim().toLowerCase() === 'true';
  const returned = raw.returned?.trim().toLowerCase() === 'true';

  // Product metadata
  const productId = raw.product_id?.trim() || 'UNKNOWN_PRODUCT';
  const productTitle = raw.product_title?.trim() || 'Untitled Product';
  const productCategory = raw.product_category?.trim() || 'Uncategorized';
  const variant = raw.variant?.trim() || '';

  // Numeric fields
  const quantity = parseInt(raw.quantity ?? '', 10);
  if (Number.isNaN(quantity) || quantity <= 0) {
    throw new Error(`Row ${rowNum}: Invalid 'quantity' "${raw.quantity}". Must be a positive integer.`);
  }

  const unitPrice = parseFloat(raw.unit_price ?? '');
  if (Number.isNaN(unitPrice) || unitPrice < 0) {
    throw new Error(`Row ${rowNum}: Invalid 'unit_price' "${raw.unit_price}". Must be a non-negative number.`);
  }

  const discountAmount = raw.discount_amount ? parseFloat(raw.discount_amount) : 0;
  if (Number.isNaN(discountAmount) || discountAmount < 0) {
    throw new Error(
      `Row ${rowNum}: Invalid 'discount_amount' "${raw.discount_amount}". Must be non-negative.`
    );
  }

  let lineTotal = raw.line_total ? parseFloat(raw.line_total) : NaN;
  if (Number.isNaN(lineTotal)) {
    // Fallback: calculate lineTotal if missing
    lineTotal = quantity * unitPrice - discountAmount;
  }

  const salesChannel = raw.sales_channel?.trim() || 'Online Store';
  const fulfillmentStatus = raw.fulfillment_status?.trim() || 'unfulfilled';

  // Returns & Refunds fields (conditional on 'returned')
  let returnDate: string | null = null;
  let returnReason: string | null = null;
  let refundAmount: number | null = null;

  if (returned) {
    const rawReturnDate = raw.return_date?.trim();
    if (rawReturnDate && ISO_DATE_REGEX.test(rawReturnDate)) {
      returnDate = rawReturnDate;
    }

    const rawReturnReason = raw.return_reason?.trim();
    if (rawReturnReason) {
      returnReason = rawReturnReason;
    }

    if (raw.refund_amount !== undefined && raw.refund_amount !== null && raw.refund_amount.trim() !== '') {
      const parsedRefund = parseFloat(raw.refund_amount.trim());
      if (!Number.isNaN(parsedRefund) && parsedRefund >= 0) {
        refundAmount = parsedRefund;
      }
    }
  }

  return {
    orderId,
    lineItemId,
    orderDate,
    customerId,
    isRepeatCustomer,
    productId,
    productTitle,
    productCategory,
    variant,
    quantity,
    unitPrice,
    discountAmount,
    lineTotal,
    salesChannel,
    fulfillmentStatus,
    returned,
    returnDate,
    returnReason,
    refundAmount,
  };
}

/**
 * Parses a CSV string containing order history data.
 * Collects any invalid records into the errors array while preserving valid records.
 */
export function parseOrderHistoryCSV(csvContent: string): ParseResult {
  const parsed = Papa.parse<RawOrderRow>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  const validItems: OrderLineItem[] = [];
  const errors: string[] = [];

  // Include papa parse syntax errors if any
  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push(`CSV Parse Error at row ${err.row}: ${err.message}`);
    }
  }

  parsed.data.forEach((row, index) => {
    try {
      const item = parseOrderRow(row, index);
      validItems.push(item);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
    }
  });

  return {
    data: validItems,
    errors,
    totalRowsProcessed: parsed.data.length,
    validRowCount: validItems.length,
    invalidRowCount: errors.length,
  };
}
