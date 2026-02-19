/**
 * Gantt Export Utilities
 * Functions for exporting Gantt timeline to PNG, PDF, and Excel formats
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Task } from '../types';

export interface PDFExportOptions {
  orientation: 'portrait' | 'landscape';
  includeDependencies: boolean;
  projectName?: string;
  dateRange?: { start: Date; end: Date };
}

export interface ExcelExportOptions {
  includeSubtasks?: boolean;
  includeCustomFields?: boolean;
}

/**
 * Export Gantt timeline to PNG image
 * Captures visible timeline area at 2x resolution for print quality
 */
export async function exportGanttToPNG(
  timelineElement: HTMLElement,
  filename: string = 'gantt-timeline.png'
): Promise<void> {
  try {
    // Capture the timeline element at 2x scale for high DPI
    const canvas = await html2canvas(timelineElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // Convert to blob and trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw new Error('Failed to export timeline as PNG. Please try again.');
  }
}

/**
 * Export Gantt timeline to PDF document
 * Handles multi-page rendering for wide timelines
 */
export async function exportGanttToPDF(
  tasks: Task[],
  timelineElement: HTMLElement,
  options: PDFExportOptions
): Promise<void> {
  try {
    const { orientation, includeDependencies, projectName, dateRange } = options;

    // Capture timeline as canvas
    const canvas = await html2canvas(timelineElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    // PDF dimensions (in mm)
    const pageWidth = orientation === 'portrait' ? 210 : 297; // A4
    const pageHeight = orientation === 'portrait' ? 297 : 210;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    // Add header with project info
    pdf.setFontSize(16);
    pdf.text(projectName || 'Project Timeline', margin, margin + 10);

    if (dateRange) {
      pdf.setFontSize(10);
      pdf.text(
        `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
        margin,
        margin + 18
      );
    }

    // Calculate image dimensions to fit page width
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add timeline image (multi-page if needed)
    const headerHeight = 25; // Space for header
    const availableHeight = pageHeight - headerHeight - margin;
    let yPosition = margin + headerHeight;
    let remainingHeight = imgHeight;

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      margin,
      yPosition,
      imgWidth,
      Math.min(imgHeight, availableHeight)
    );

    remainingHeight -= availableHeight;

    // Add additional pages if timeline is tall
    while (remainingHeight > 0) {
      pdf.addPage();
      const heightToCopy = Math.min(remainingHeight, pageHeight - 2 * margin);

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        imgWidth,
        heightToCopy
      );

      remainingHeight -= heightToCopy;
    }

    // Add task summary page if requested
    if (includeDependencies && tasks.length > 0) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Task Summary', margin, margin + 10);

      pdf.setFontSize(9);
      let y = margin + 20;
      const lineHeight = 5;

      tasks.forEach((task, index) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin + 10;
        }

        // Task info
        pdf.text(`${index + 1}. ${task.title}`, margin, y);
        y += lineHeight;

        if (task.startDate || task.dueDate) {
          const dates = `   ${task.startDate || 'No start'} → ${task.dueDate || 'No end'}`;
          pdf.text(dates, margin, y);
          y += lineHeight;
        }

        if (task.dependencies && task.dependencies.length > 0) {
          const deps = task.dependencies.map((d) => d.taskId).join(', ');
          pdf.text(`   Dependencies: ${deps}`, margin, y);
          y += lineHeight;
        }

        y += 2; // Extra spacing between tasks
      });
    }

    // Save PDF
    pdf.save(`${projectName || 'gantt-timeline'}.pdf`);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw new Error('Failed to export timeline as PDF. Please try again.');
  }
}

/**
 * Export Gantt tasks to Excel spreadsheet
 * Includes all task fields in tabular format
 */
export async function exportGanttToExcel(
  tasks: Task[],
  filename: string = 'gantt-tasks.xlsx',
  options: ExcelExportOptions = {}
): Promise<void> {
  try {
    const writeXlsxFile = (await import('write-excel-file')).default;
    const { includeSubtasks = true, includeCustomFields = true } = options;

    type CellObj = { type: StringConstructor | NumberConstructor; value: string | number };

    // Header row
    const headerRow: CellObj[] = [
      { type: String, value: 'Task Name' },
      { type: String, value: 'Status' },
      { type: String, value: 'Priority' },
      { type: String, value: 'Start Date' },
      { type: String, value: 'Due Date' },
      { type: String, value: 'Duration (days)' },
      { type: String, value: 'Progress (%)' },
      { type: String, value: 'Assignees' },
      { type: String, value: 'Dependencies' },
      { type: String, value: 'Tags' },
      { type: String, value: 'Estimated Hours' },
      { type: String, value: 'Actual Hours' },
      { type: String, value: 'Is Milestone' },
    ];

    if (includeCustomFields) {
      headerRow.push({ type: String, value: 'Custom Fields' });
    }

    const dataRows: CellObj[][] = [];

    // Data rows
    tasks.forEach((task) => {
      const duration = calculateDuration(task.startDate, task.dueDate);
      const row: CellObj[] = [
        { type: String, value: task.title },
        { type: String, value: task.status },
        { type: String, value: task.priority || '' },
        { type: String, value: task.startDate || '' },
        { type: String, value: task.dueDate || '' },
        typeof duration === 'number'
          ? { type: Number, value: duration }
          : { type: String, value: '' },
        { type: Number, value: task.progress || 0 },
        { type: String, value: task.assignees?.join(', ') || '' },
        { type: String, value: task.dependencies?.map((d) => `${d.taskId} (${d.type})`).join(', ') || '' },
        { type: String, value: task.tags?.join(', ') || '' },
        { type: String, value: String(task.estimatedHours || '') },
        { type: String, value: String(task.actualHours || '') },
        { type: String, value: task.isMilestone ? 'Yes' : 'No' },
      ];

      if (includeCustomFields) {
        row.push({ type: String, value: task.customFields ? JSON.stringify(task.customFields) : '' });
      }

      dataRows.push(row);

      // Add subtasks if requested
      if (includeSubtasks && task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => {
          const subtaskRow: CellObj[] = [
            { type: String, value: `  └─ ${subtask.title}` },
            { type: String, value: subtask.completed ? 'done' : 'todo' },
            { type: String, value: subtask.priority || '' },
            { type: String, value: '' },
            { type: String, value: subtask.dueDate || '' },
            { type: String, value: '' },
            { type: Number, value: subtask.completed ? 100 : 0 },
            { type: String, value: '' },
            { type: String, value: '' },
            { type: String, value: '' },
            { type: String, value: '' },
            { type: String, value: '' },
            { type: String, value: 'No' },
          ];

          if (includeCustomFields) {
            subtaskRow.push({ type: String, value: '' });
          }

          dataRows.push(subtaskRow);
        });
      }
    });

    const columns = [
      { width: 30 }, // Task Name
      { width: 12 }, // Status
      { width: 10 }, // Priority
      { width: 12 }, // Start Date
      { width: 12 }, // Due Date
      { width: 12 }, // Duration
      { width: 10 }, // Progress
      { width: 20 }, // Assignees
      { width: 30 }, // Dependencies
      { width: 20 }, // Tags
      { width: 12 }, // Estimated Hours
      { width: 12 }, // Actual Hours
      { width: 12 }, // Is Milestone
    ];

    if (includeCustomFields) {
      columns.push({ width: 30 });
    }

    await writeXlsxFile([headerRow, ...dataRows], {
      columns,
      fileName: filename,
    });
  } catch (error) {
    console.error('Failed to export Excel:', error);
    throw new Error('Failed to export tasks to Excel. Please try again.');
  }
}

/**
 * Calculate duration in days between two dates
 */
function calculateDuration(startDate: string | null, dueDate: string | null): number | string {
  if (!startDate || !dueDate) return '';

  const start = new Date(startDate);
  const end = new Date(dueDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
