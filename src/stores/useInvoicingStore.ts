import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, InvoiceSettings, InvoiceFilters, InvoiceLineItem, InvoicingState } from '../types/invoicing';
import type { TimeEntry } from '../types';
import { db } from '../db/timeTrackingDb';
import Dexie from 'dexie';
import { logger } from '../services/logger';
import { resolveRate } from '../utils/billableRateResolver';
import { useTimeTrackingStore } from './useTimeTrackingStore';

const log = logger.module('Invoicing');

// Extend Dexie database with invoices table
class InvoicingDatabase extends Dexie {
  invoices!: Dexie.Table<Invoice, string>;

  constructor() {
    super('NeumanOSInvoicing');

    this.version(1).stores({
      invoices: 'id, invoiceNumber, clientName, invoiceDate, status, createdAt'
    });
  }
}

const invoiceDb = new InvoicingDatabase();

interface InvoicingStore extends InvoicingState {
  // ==================== INVOICE CRUD ====================

  /**
   * Create a new invoice
   */
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  /**
   * Update an existing invoice
   */
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;

  /**
   * Delete an invoice
   */
  deleteInvoice: (id: string) => Promise<void>;

  /**
   * Get invoice by ID
   */
  getInvoice: (id: string) => Invoice | undefined;

  /**
   * Load invoices from database
   */
  loadInvoices: () => Promise<void>;

  /**
   * Mark invoice as paid
   */
  markAsPaid: (id: string) => Promise<void>;

  /**
   * Mark invoice as sent
   */
  markAsSent: (id: string) => Promise<void>;

  // ==================== INVOICE GENERATION ====================

  /**
   * Generate invoice from time entries
   */
  generateInvoice: (
    timeEntries: TimeEntry[],
    filters: InvoiceFilters,
    clientName: string,
    clientEmail?: string,
    notes?: string
  ) => Promise<Invoice>;

  /**
   * Get next invoice number
   */
  getNextInvoiceNumber: () => string;

  // ==================== SETTINGS ====================

  /**
   * Update invoice settings
   */
  updateSettings: (updates: Partial<InvoiceSettings>) => void;

  // ==================== UI STATE ====================

  /**
   * Set selected invoice
   */
  setSelectedInvoice: (id: string | null) => void;

  /**
   * Set generating state
   */
  setGenerating: (isGenerating: boolean) => void;

  // ==================== EXPORT ====================

  /**
   * Export invoice to CSV
   */
  exportToCSV: (invoice: Invoice) => string;

  /**
   * Export invoice to JSON
   */
  exportToJSON: (invoice: Invoice) => string;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  companyName: '',
  nextInvoiceNumber: 1,
  invoicePrefix: 'INV-',
  defaultTaxRate: 0,
  defaultPaymentTerms: 30,
  currency: 'USD',
  currencySymbol: '$'
};

export const useInvoicingStore = create<InvoicingStore>()(
  persist(
    (set, get) => ({
      // ==================== INITIAL STATE ====================
      invoices: [],
      settings: DEFAULT_SETTINGS,
      selectedInvoiceId: null,
      isGenerating: false,

      // ==================== INVOICE CRUD ====================

      createInvoice: async (invoiceData) => {
        const { invoices, settings } = get();

        const invoice: Invoice = {
          ...invoiceData,
          id: crypto.randomUUID(),
          invoiceNumber: invoiceData.invoiceNumber || get().getNextInvoiceNumber(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to IndexedDB
        await invoiceDb.invoices.add(invoice);

        // Update state
        set({
          invoices: [invoice, ...invoices],
          settings: {
            ...settings,
            nextInvoiceNumber: settings.nextInvoiceNumber + 1
          }
        });

        log.info('Invoice created', { invoiceNumber: invoice.invoiceNumber });
      },

      updateInvoice: async (id, updates) => {
        const { invoices } = get();

        const updatedInvoice = {
          ...updates,
          updatedAt: new Date().toISOString()
        };

        // Update in IndexedDB
        await invoiceDb.invoices.update(id, updatedInvoice);

        // Update state
        set({
          invoices: invoices.map(inv =>
            inv.id === id ? { ...inv, ...updatedInvoice } : inv
          )
        });

        log.info('Invoice updated', { id });
      },

      deleteInvoice: async (id) => {
        const { invoices } = get();

        // Delete from IndexedDB
        await invoiceDb.invoices.delete(id);

        // Update state
        set({ invoices: invoices.filter(inv => inv.id !== id) });

        log.info('Invoice deleted', { id });
      },

      getInvoice: (id) => {
        const { invoices } = get();
        return invoices.find(inv => inv.id === id);
      },

      loadInvoices: async () => {
        const invoices = await invoiceDb.invoices.orderBy('createdAt').reverse().toArray();
        set({ invoices });
        log.info('Invoices loaded', { count: invoices.length });
      },

      markAsPaid: async (id) => {
        await get().updateInvoice(id, {
          status: 'paid',
          paidAt: new Date().toISOString()
        });
      },

      markAsSent: async (id) => {
        await get().updateInvoice(id, {
          status: 'sent'
        });
      },

      // ==================== INVOICE GENERATION ====================

      generateInvoice: async (timeEntries, filters, clientName, clientEmail, notes) => {
        const { settings } = get();
        set({ isGenerating: true });

        try {
          // Filter time entries
          let filteredEntries = [...timeEntries];

          if (filters.billableOnly) {
            filteredEntries = filteredEntries.filter(entry => entry.billable);
          }

          if (filters.projectIds.length > 0) {
            filteredEntries = filteredEntries.filter(entry =>
              entry.projectId && filters.projectIds.includes(entry.projectId)
            );
          }

          if (filters.startDate) {
            filteredEntries = filteredEntries.filter(entry =>
              entry.startTime >= filters.startDate!
            );
          }

          if (filters.endDate) {
            filteredEntries = filteredEntries.filter(entry =>
              entry.startTime <= filters.endDate!
            );
          }

          // Group entries into line items
          const lineItems: InvoiceLineItem[] = [];

          // Get rate context for cascading rate resolution (entry > project > global)
          const { defaultHourlyRate, projects: allProjects } = useTimeTrackingStore.getState();
          const rateCtx = { defaultHourlyRate, projects: allProjects };

          if (filters.groupBy === 'project') {
            // Group by project
            const projectGroups = new Map<string, TimeEntry[]>();
            filteredEntries.forEach(entry => {
              const key = entry.projectId || 'no-project';
              if (!projectGroups.has(key)) {
                projectGroups.set(key, []);
              }
              projectGroups.get(key)!.push(entry);
            });

            // Load projects to get names
            const projects = await db.projects.toArray();
            const projectMap = new Map(projects.map(p => [p.id, p]));

            projectGroups.forEach((entries, projectId) => {
              const project = projectMap.get(projectId);
              // Use cascading rate: sum each entry's resolved rate * hours
              let totalAmount = 0;
              let totalHours = 0;
              entries.forEach((e) => {
                const hours = e.duration / 3600;
                const { rate: entryRate } = resolveRate(e, rateCtx);
                totalHours += hours;
                totalAmount += hours * entryRate;
              });
              const rate = totalHours > 0 ? totalAmount / totalHours : 0;
              const amount = totalAmount;

              lineItems.push({
                id: crypto.randomUUID(),
                description: project?.name || 'No Project',
                quantity: Math.round(totalHours * 100) / 100,
                rate,
                amount: Math.round(amount * 100) / 100,
                timeEntryIds: entries.map(e => e.id),
                projectId: projectId !== 'no-project' ? projectId : undefined
              });
            });
          } else if (filters.groupBy === 'date') {
            // Group by date
            const dateGroups = new Map<string, TimeEntry[]>();
            filteredEntries.forEach(entry => {
              const date = entry.startTime.split('T')[0];
              if (!dateGroups.has(date)) {
                dateGroups.set(date, []);
              }
              dateGroups.get(date)!.push(entry);
            });

            dateGroups.forEach((entries, date) => {
              let totalAmount = 0;
              let totalHours = 0;
              entries.forEach((e) => {
                const hours = e.duration / 3600;
                const { rate: entryRate } = resolveRate(e, rateCtx);
                totalHours += hours;
                totalAmount += hours * entryRate;
              });
              const rate = totalHours > 0 ? totalAmount / totalHours : 0;
              const amount = totalAmount;

              lineItems.push({
                id: crypto.randomUUID(),
                description: `Work on ${new Date(date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}`,
                quantity: Math.round(totalHours * 100) / 100,
                rate,
                amount: Math.round(amount * 100) / 100,
                timeEntryIds: entries.map(e => e.id),
                dateRange: { start: date, end: date }
              });
            });
          } else {
            // No grouping - one line per entry
            filteredEntries.forEach(entry => {
              const hours = entry.duration / 3600;
              const { rate } = resolveRate(entry, rateCtx);
              const amount = hours * rate;

              lineItems.push({
                id: crypto.randomUUID(),
                description: entry.description,
                quantity: Math.round(hours * 100) / 100,
                rate,
                amount: Math.round(amount * 100) / 100,
                timeEntryIds: [entry.id],
                projectId: entry.projectId
              });
            });
          }

          // Calculate totals
          const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
          const taxRate = settings.defaultTaxRate;
          const taxAmount = (subtotal * taxRate) / 100;
          const total = subtotal + taxAmount;

          // Create invoice
          const invoiceDate = new Date().toISOString().split('T')[0];
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + settings.defaultPaymentTerms);

          const invoice: Invoice = {
            id: crypto.randomUUID(),
            invoiceNumber: get().getNextInvoiceNumber(),
            clientName,
            clientEmail,
            invoiceDate,
            dueDate: dueDate.toISOString().split('T')[0],
            lineItems,
            subtotal: Math.round(subtotal * 100) / 100,
            taxRate,
            taxAmount: Math.round(taxAmount * 100) / 100,
            total: Math.round(total * 100) / 100,
            status: 'draft',
            notes: notes || settings.defaultNotes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          set({ isGenerating: false });
          return invoice;
        } catch (error) {
          log.error('Failed to generate invoice', { error });
          set({ isGenerating: false });
          throw error;
        }
      },

      getNextInvoiceNumber: () => {
        const { settings } = get();
        return `${settings.invoicePrefix}${settings.nextInvoiceNumber.toString().padStart(3, '0')}`;
      },

      // ==================== SETTINGS ====================

      updateSettings: (updates) => {
        const { settings } = get();
        set({ settings: { ...settings, ...updates } });
      },

      // ==================== UI STATE ====================

      setSelectedInvoice: (id) => {
        set({ selectedInvoiceId: id });
      },

      setGenerating: (isGenerating) => {
        set({ isGenerating });
      },

      // ==================== EXPORT ====================

      exportToCSV: (invoice) => {
        const { settings } = get();

        const header = 'Description,Quantity,Rate,Amount\n';
        const rows = invoice.lineItems.map(item =>
          `"${item.description}",${item.quantity},${settings.currencySymbol}${item.rate},${settings.currencySymbol}${item.amount}`
        ).join('\n');

        const summary = `\nSubtotal,,${settings.currencySymbol}${invoice.subtotal}\nTax (${invoice.taxRate}%),,${settings.currencySymbol}${invoice.taxAmount}\nTotal,,${settings.currencySymbol}${invoice.total}`;

        return header + rows + summary;
      },

      exportToJSON: (invoice) => {
        return JSON.stringify(invoice, null, 2);
      }
    }),
    {
      name: 'invoicing-storage',
      partialize: (state) => ({
        settings: state.settings
      }),
      version: 1
    }
  )
);

// Initialize invoicing store by loading invoices from IndexedDB
export const initializeInvoicing = async () => {
  const store = useInvoicingStore.getState();
  await store.loadInvoices();
};
