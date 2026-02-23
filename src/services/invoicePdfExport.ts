/**
 * Invoice PDF Export Service
 *
 * Generates professional PDF invoices using jsPDF.
 * Includes: company logo placeholder, client info, line items with hours/rates,
 * subtotal/tax/total, and optional notes.
 */

import { jsPDF } from 'jspdf';
import type { Invoice, InvoiceSettings } from '../types/invoicing';

/** Configurable colors for the PDF theme */
const PDF_COLORS = {
  primary: [55, 65, 81] as [number, number, number],       // gray-700
  secondary: [107, 114, 128] as [number, number, number],   // gray-500
  accent: [99, 102, 241] as [number, number, number],       // indigo-500
  headerBg: [243, 244, 246] as [number, number, number],    // gray-100
  divider: [229, 231, 235] as [number, number, number],     // gray-200
  totalBg: [238, 242, 255] as [number, number, number],     // indigo-50
};

/**
 * Generate a professional PDF invoice and trigger download.
 */
export function exportInvoicePdf(
  invoice: Invoice,
  settings: InvoiceSettings
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ========== HEADER: Company Info + Invoice Number ==========

  // Company logo placeholder (colored rectangle)
  if (settings.companyLogo) {
    try {
      doc.addImage(settings.companyLogo, 'PNG', margin, y, 40, 20);
      y += 25;
    } catch {
      // Skip if logo is invalid
      drawLogoPlaceholder(doc, margin, y);
      y += 25;
    }
  } else {
    drawLogoPlaceholder(doc, margin, y);
    y += 25;
  }

  // Company name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(settings.companyName || 'Your Company', margin, y);

  // Invoice label on the right
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Company address / contact
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.secondary);

  if (settings.companyAddress) {
    doc.text(settings.companyAddress, margin, y);
    y += 4.5;
  }
  if (settings.companyEmail) {
    doc.text(settings.companyEmail, margin, y);
    y += 4.5;
  }
  if (settings.companyPhone) {
    doc.text(settings.companyPhone, margin, y);
    y += 4.5;
  }

  y += 6;

  // ========== INVOICE DETAILS ROW ==========

  // Divider line
  doc.setDrawColor(...PDF_COLORS.divider);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Left: Bill To
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('BILL TO', margin, y);

  // Right: Invoice details
  const rightCol = pageWidth - margin - 60;
  doc.text('INVOICE #', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(invoice.invoiceNumber, rightCol + 62, y, { align: 'right' });

  y += 5;

  // Client name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(invoice.clientName, margin, y);

  // Invoice date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('DATE', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(formatDate(invoice.invoiceDate), rightCol + 62, y, { align: 'right' });

  y += 5;

  // Client email
  if (invoice.clientEmail) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(invoice.clientEmail, margin, y);
  }

  // Due date
  if (invoice.dueDate) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text('DUE DATE', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(formatDate(invoice.dueDate), rightCol + 62, y, { align: 'right' });
  }

  y += 5;

  // Client address
  if (invoice.clientAddress) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.secondary);
    const addressLines = doc.splitTextToSize(invoice.clientAddress, contentWidth / 2);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4.5;
  }

  // Status badge
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('STATUS', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(invoice.status.toUpperCase(), rightCol + 62, y, { align: 'right' });

  y += 12;

  // ========== LINE ITEMS TABLE ==========

  // Table header
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(margin, y - 4, contentWidth, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.secondary);

  const descCol = margin + 2;
  const qtyCol = pageWidth - margin - 75;
  const rateCol = pageWidth - margin - 45;
  const amtCol = pageWidth - margin - 2;

  doc.text('DESCRIPTION', descCol, y);
  doc.text('HOURS', qtyCol, y);
  doc.text('RATE', rateCol, y);
  doc.text('AMOUNT', amtCol, y, { align: 'right' });

  y += 8;

  // Line items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.primary);

  invoice.lineItems.forEach((item, index) => {
    // Page break check
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 4, contentWidth, 7, 'F');
    }

    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.primary);

    // Truncate long descriptions
    const maxDescWidth = qtyCol - descCol - 5;
    const truncatedDesc = truncateText(doc, item.description, maxDescWidth);
    doc.text(truncatedDesc, descCol, y);

    doc.text(item.quantity.toFixed(2), qtyCol, y);
    doc.text(`${settings.currencySymbol}${item.rate.toFixed(2)}`, rateCol, y);
    doc.text(
      `${settings.currencySymbol}${item.amount.toFixed(2)}`,
      amtCol,
      y,
      { align: 'right' }
    );

    y += 7;
  });

  y += 4;

  // ========== TOTALS ==========

  // Divider
  doc.setDrawColor(...PDF_COLORS.divider);
  doc.line(qtyCol - 10, y, pageWidth - margin, y);
  y += 8;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('Subtotal', rateCol - 15, y);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(
    `${settings.currencySymbol}${invoice.subtotal.toFixed(2)}`,
    amtCol,
    y,
    { align: 'right' }
  );
  y += 6;

  // Tax
  if (invoice.taxRate > 0) {
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(`Tax (${invoice.taxRate}%)`, rateCol - 15, y);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(
      `${settings.currencySymbol}${invoice.taxAmount.toFixed(2)}`,
      amtCol,
      y,
      { align: 'right' }
    );
    y += 6;
  }

  // Total with background
  y += 2;
  doc.setFillColor(...PDF_COLORS.totalBg);
  doc.rect(qtyCol - 10, y - 5, pageWidth - margin - qtyCol + 10, 10, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text('Total', rateCol - 15, y + 1);
  doc.text(
    `${settings.currencySymbol}${invoice.total.toFixed(2)}`,
    amtCol,
    y + 1,
    { align: 'right' }
  );

  y += 18;

  // ========== NOTES ==========

  if (invoice.notes) {
    // Page break check
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text('NOTES', margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.primary);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.5;
  }

  // ========== FOOTER ==========

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.setDrawColor(...PDF_COLORS.divider);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  doc.text(
    `${settings.companyName || 'Your Company'} — Thank you for your business`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

/** Draw a simple colored rectangle as logo placeholder */
function drawLogoPlaceholder(doc: jsPDF, x: number, y: number): void {
  doc.setFillColor(...PDF_COLORS.accent);
  doc.roundedRect(x, y, 35, 12, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('LOGO', x + 17.5, y + 7.5, { align: 'center' });
}

/** Format ISO date string to readable format */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Truncate text to fit within a given width */
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  const textWidth = doc.getTextWidth(text);
  if (textWidth <= maxWidth) return text;

  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}
