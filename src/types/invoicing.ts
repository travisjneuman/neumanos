/**
 * Invoicing Types for Time Tracking
 *
 * Supports professional invoice generation from time entries with
 * flexible filtering, tax calculation, and export capabilities.
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceExportFormat = 'pdf' | 'csv' | 'json';

/**
 * Line item on an invoice (usually grouped time entries)
 */
export interface InvoiceLineItem {
  id: string;
  description: string;           // e.g., "Web Development - Project X"
  quantity: number;              // Hours worked
  rate: number;                  // USD per hour
  amount: number;                // quantity × rate (calculated)
  timeEntryIds: string[];        // Source time entries for this line item
  projectId?: string;            // Optional: link to project
  dateRange?: {                  // Optional: date range for this line item
    start: string;               // ISO date
    end: string;                 // ISO date
  };
}

/**
 * Invoice document
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;         // Auto-generated (e.g., "INV-001")

  // Client info
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;

  // Dates
  invoiceDate: string;           // ISO date
  dueDate?: string;              // ISO date

  // Line items
  lineItems: InvoiceLineItem[];

  // Calculations
  subtotal: number;              // Sum of all line items
  taxRate: number;               // Percentage (0-100)
  taxAmount: number;             // subtotal × (taxRate / 100)
  total: number;                 // subtotal + taxAmount

  // Status
  status: InvoiceStatus;
  paidAt?: string;               // ISO date (when marked as paid)

  // Notes
  notes?: string;                // Additional notes/terms

  // Metadata
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  createdBy?: string;            // Future: user ID
}

/**
 * Invoice generation settings/preferences
 */
export interface InvoiceSettings {
  // Company info (appears on invoice header)
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyLogo?: string;          // Base64 data URI

  // Invoice numbering
  nextInvoiceNumber: number;     // Auto-increment counter
  invoicePrefix: string;         // e.g., "INV-"

  // Default values
  defaultTaxRate: number;        // Default tax percentage (0-100)
  defaultPaymentTerms: number;   // Days until due (e.g., 30)
  defaultNotes?: string;         // Default invoice notes/terms

  // Currency (future: multi-currency support)
  currency: string;              // Default: "USD"
  currencySymbol: string;        // Default: "$"
}

/**
 * Invoice filter options for generating invoices from time entries
 */
export interface InvoiceFilters {
  startDate?: string;            // ISO date
  endDate?: string;              // ISO date
  projectIds: string[];          // Filter by specific projects
  billableOnly: boolean;         // Only include billable entries
  groupBy: 'project' | 'date' | 'none'; // How to group line items
}

/**
 * Invoice store state
 */
export interface InvoicingState {
  invoices: Invoice[];
  settings: InvoiceSettings;

  // UI state
  selectedInvoiceId: string | null;
  isGenerating: boolean;
}
