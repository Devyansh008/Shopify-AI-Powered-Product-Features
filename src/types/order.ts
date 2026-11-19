/**
 * Core domain types for Shopify Order Line Items.
 * Reflects the schema of "Store Order History, May to October 2025.csv".
 */

export type SalesChannel =
  | 'Online Store'
  | 'Shop app'
  | 'Point of Sale'
  | 'Instagram'
  | (string & {});

export type FulfillmentStatus =
  | 'fulfilled'
  | 'partially_fulfilled'
  | 'unfulfilled'
  | (string & {});

export type ProductCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Outerwear'
  | 'Knitwear'
  | 'Accessories'
  | (string & {});

/**
 * Parsed and validated order line item.
 * All numeric and boolean fields are strongly typed,
 * with missing optional values normalized to null or sensible defaults.
 */
export interface OrderLineItem {
  orderId: string;
  lineItemId: string;
  orderDate: string; // ISO Date string 'YYYY-MM-DD'
  customerId: string;
  isRepeatCustomer: boolean;
  productId: string;
  productTitle: string;
  productCategory: ProductCategory;
  variant: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  salesChannel: SalesChannel;
  fulfillmentStatus: FulfillmentStatus;
  returned: boolean;
  returnDate: string | null; // ISO Date string 'YYYY-MM-DD' or null
  returnReason: string | null;
  refundAmount: number | null;
}

/**
 * Raw string record representing a line item row in the CSV file.
 */
export interface RawOrderRow {
  order_id?: string;
  line_item_id?: string;
  order_date?: string;
  customer_id?: string;
  is_repeat_customer?: string;
  product_id?: string;
  product_title?: string;
  product_category?: string;
  variant?: string;
  quantity?: string;
  unit_price?: string;
  discount_amount?: string;
  line_total?: string;
  sales_channel?: string;
  fulfillment_status?: string;
  returned?: string;
  return_date?: string;
  return_reason?: string;
  refund_amount?: string;
  [key: string]: string | undefined;
}

/**
 * Result of CSV parsing and validation.
 */
export interface ParseResult {
  data: OrderLineItem[];
  errors: string[];
  totalRowsProcessed: number;
  validRowCount: number;
  invalidRowCount: number;
}

