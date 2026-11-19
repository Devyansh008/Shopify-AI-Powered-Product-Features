import fs from 'fs';
import path from 'path';
import { parseOrderHistoryCSV } from './parser';
import { OrderLineItem, ParseResult } from '../types/order';

const DEFAULT_CSV_FILENAME = 'Store Order History, May to October 2025.csv';

let cachedParseResult: ParseResult | null = null;

/**
 * Resolves the path to the store order history CSV file.
 * Checks current working directory, src/data, and root project paths.
 */
export function getCSVFilePath(customPath?: string): string {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const candidatePaths = [
    path.resolve(process.cwd(), DEFAULT_CSV_FILENAME),
    path.resolve(process.cwd(), 'src', 'data', DEFAULT_CSV_FILENAME),
    path.resolve(__dirname, '..', '..', DEFAULT_CSV_FILENAME),
    path.resolve(__dirname, DEFAULT_CSV_FILENAME),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to primary expected path
  return path.resolve(process.cwd(), DEFAULT_CSV_FILENAME);
}

/**
 * Reads and parses the dataset from disk.
 * Caches the result in memory for optimal performance across multiple queries.
 */
export function loadOrderHistory(filePath?: string, forceReload: boolean = false): ParseResult {
  if (cachedParseResult && !forceReload && !filePath) {
    return cachedParseResult;
  }

  const targetPath = getCSVFilePath(filePath);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`CSV file not found at: ${targetPath}`);
  }

  const fileContent = fs.readFileSync(targetPath, 'utf-8');
  const result = parseOrderHistoryCSV(fileContent);

  if (!filePath) {
    cachedParseResult = result;
  }

  return result;
}

/**
 * Convenience helper returning only the valid line items array.
 */
export function getOrderItems(filePath?: string): OrderLineItem[] {
  return loadOrderHistory(filePath).data;
}
