/**
 * Document Export Utilities
 *
 * Export TipTap document content to various formats.
 * Uses browser-native features where possible to minimize dependencies.
 *
 * Supported formats:
 * - PDF: Via browser print dialog
 * - HTML: Download as .html file
 * - Markdown: Basic conversion from HTML
 */

import type { Editor } from '@tiptap/react';
import DOMPurify from 'dompurify';
import { toast } from '../../stores/useToastStore';

/** PDF print stylesheet with proper pagination and formatting */
const PDF_STYLES = `
  @page {
    size: letter;
    margin: 0.75in 1in;
  }
  @media print {
    body { margin: 0; padding: 0; }
    .print-preview-controls { display: none !important; }
  }
  * { box-sizing: border-box; }
  body {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.75in 1in;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #fff;
  }
  /* Title styling */
  .doc-title {
    font-size: 28pt;
    font-weight: 700;
    margin: 0 0 8pt;
    line-height: 1.2;
    color: #111;
    border-bottom: 2pt solid #333;
    padding-bottom: 12pt;
  }
  .doc-meta {
    font-size: 10pt;
    color: #666;
    margin-bottom: 24pt;
  }
  /* Headings */
  h1 { font-size: 22pt; margin: 24pt 0 10pt; font-weight: 700; color: #111; }
  h2 { font-size: 16pt; margin: 20pt 0 8pt; font-weight: 600; color: #222; }
  h3 { font-size: 13pt; margin: 16pt 0 6pt; font-weight: 600; color: #333; }
  h4 { font-size: 12pt; margin: 14pt 0 6pt; font-weight: 600; color: #444; }
  h5, h6 { font-size: 11pt; margin: 12pt 0 4pt; font-weight: 600; color: #555; }
  /* Prevent orphaned headings */
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
  /* Text */
  p { margin: 6pt 0; orphans: 3; widows: 3; }
  strong, b { font-weight: 700; }
  em, i { font-style: italic; }
  u { text-decoration: underline; }
  s, del, strike { text-decoration: line-through; }
  /* Links */
  a { color: #1a56db; text-decoration: underline; }
  /* Lists */
  ul, ol { margin: 8pt 0; padding-left: 28pt; }
  li { margin: 3pt 0; }
  li > ul, li > ol { margin: 2pt 0; }
  /* Blockquotes */
  blockquote {
    margin: 12pt 0;
    padding: 8pt 16pt;
    border-left: 3pt solid #999;
    color: #555;
    font-style: italic;
    background: #fafafa;
    page-break-inside: avoid;
  }
  /* Code */
  pre {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background: #f4f4f4;
    border: 1pt solid #ddd;
    border-radius: 4pt;
    padding: 10pt;
    margin: 10pt 0;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: avoid;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10pt;
    background: #f0f0f0;
    padding: 1pt 4pt;
    border-radius: 2pt;
  }
  pre code { background: none; padding: 0; border-radius: 0; }
  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12pt 0;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1pt solid #bbb;
    padding: 6pt 8pt;
    text-align: left;
    font-size: 11pt;
  }
  th {
    background: #f0f0f0;
    font-weight: 600;
    border-bottom: 2pt solid #999;
  }
  /* Images */
  img {
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
    margin: 8pt 0;
  }
  /* Horizontal rules */
  hr {
    border: none;
    border-top: 1pt solid #ccc;
    margin: 20pt 0;
  }
  /* Highlights (remove background for print) */
  mark { background: #fef08a; padding: 0 2pt; }
  /* Text alignment */
  [style*="text-align: center"] { text-align: center; }
  [style*="text-align: right"] { text-align: right; }
  [style*="text-align: justify"] { text-align: justify; }
  /* Print preview controls */
  .print-preview-controls {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #333;
    color: #fff;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 1000;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .print-preview-controls button {
    background: #fff;
    color: #333;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }
  .print-preview-controls button:hover { background: #eee; }
  .print-preview-controls button.primary {
    background: #3b82f6;
    color: #fff;
  }
  .print-preview-controls button.primary:hover { background: #2563eb; }
  .print-preview-body { margin-top: 52px; }
`;

/**
 * Export document as PDF with print preview.
 * Opens a formatted preview window with a toolbar to trigger print.
 */
export function exportToPDF(editor: Editor, title: string): void {
  const html = editor.getHTML();
  const sanitizedHtml = DOMPurify.sanitize(html);

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    toast.error('Please allow popups to export PDF');
    return;
  }

  const doc = printWindow.document;

  // Build head
  const head = doc.createElement('head');
  const titleEl = doc.createElement('title');
  titleEl.textContent = `Print Preview - ${title}`;
  head.appendChild(titleEl);

  const style = doc.createElement('style');
  style.textContent = PDF_STYLES;
  head.appendChild(style);

  // Build body
  const body = doc.createElement('body');

  // Print preview controls bar
  const controls = doc.createElement('div');
  controls.className = 'print-preview-controls';

  const leftGroup = doc.createElement('div');
  leftGroup.textContent = `Print Preview: ${title}`;
  controls.appendChild(leftGroup);

  const rightGroup = doc.createElement('div');
  rightGroup.style.display = 'flex';
  rightGroup.style.gap = '8px';

  const closeBtn = doc.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => printWindow.close());
  rightGroup.appendChild(closeBtn);

  const printBtn = doc.createElement('button');
  printBtn.className = 'primary';
  printBtn.textContent = 'Print / Save as PDF';
  printBtn.addEventListener('click', () => printWindow.print());
  rightGroup.appendChild(printBtn);

  controls.appendChild(rightGroup);
  body.appendChild(controls);

  // Document content wrapper
  const wrapper = doc.createElement('div');
  wrapper.className = 'print-preview-body';

  const docTitle = doc.createElement('div');
  docTitle.className = 'doc-title';
  docTitle.textContent = title;
  wrapper.appendChild(docTitle);

  const meta = doc.createElement('div');
  meta.className = 'doc-meta';
  meta.textContent = `Exported on ${new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;
  wrapper.appendChild(meta);

  const contentDiv = doc.createElement('div');
  contentDiv.appendChild(
    DOMPurify.sanitize(sanitizedHtml, { RETURN_DOM_FRAGMENT: true, RETURN_DOM: true })
  );
  wrapper.appendChild(contentDiv);

  body.appendChild(wrapper);

  doc.documentElement.appendChild(head);
  doc.documentElement.appendChild(body);
}

/**
 * Export document as HTML file
 */
export function exportToHTML(editor: Editor, title: string): void {
  const html = editor.getHTML();
  const sanitizedHtml = DOMPurify.sanitize(html);
  const escapedTitle = escapeHtml(title);

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2em; margin-top: 0; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.25em; }
    p { margin: 1em 0; }
    ul, ol { padding-left: 2em; }
    blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      border-left: 4px solid #ddd;
      color: #666;
      font-style: italic;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      font-family: 'Fira Code', 'Consolas', monospace;
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    pre code { background: none; padding: 0; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f4f4f4; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  ${sanitizedHtml}
</body>
</html>`;

  downloadFile(fullHTML, `${sanitizeFilename(title)}.html`, 'text/html');
}

/**
 * Export document as Markdown
 * Basic HTML to Markdown conversion
 */
export function exportToMarkdown(editor: Editor, title: string): void {
  const html = editor.getHTML();
  const markdown = htmlToMarkdown(html);

  const fullMarkdown = `# ${title}\n\n${markdown}`;

  downloadFile(fullMarkdown, `${sanitizeFilename(title)}.md`, 'text/markdown');
}

/**
 * Export document as plain text
 */
export function exportToText(editor: Editor, title: string): void {
  const text = editor.getText();
  const fullText = `${title}\n${'='.repeat(title.length)}\n\n${text}`;

  downloadFile(fullText, `${sanitizeFilename(title)}.txt`, 'text/plain');
}

/**
 * Basic HTML to Markdown conversion
 * Uses DOMPurify for safe parsing
 */
function htmlToMarkdown(html: string): string {
  // Create a temporary element to parse sanitized HTML
  const temp = document.createElement('div');
  const sanitized = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  temp.appendChild(sanitized);

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes)
      .map(processNode)
      .join('');

    switch (tag) {
      case 'h1':
        return `# ${children}\n\n`;
      case 'h2':
        return `## ${children}\n\n`;
      case 'h3':
        return `### ${children}\n\n`;
      case 'h4':
        return `#### ${children}\n\n`;
      case 'h5':
        return `##### ${children}\n\n`;
      case 'h6':
        return `###### ${children}\n\n`;
      case 'p':
        return `${children}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'u':
        return `<u>${children}</u>`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${children}~~`;
      case 'code':
        return `\`${children}\``;
      case 'pre':
        return `\`\`\`\n${el.textContent}\n\`\`\`\n\n`;
      case 'blockquote':
        return children
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n\n';
      case 'ul':
        return children + '\n';
      case 'ol':
        return children + '\n';
      case 'li': {
        const parent = el.parentElement;
        if (parent?.tagName.toLowerCase() === 'ol') {
          const index = Array.from(parent.children).indexOf(el) + 1;
          return `${index}. ${children.trim()}\n`;
        }
        return `- ${children.trim()}\n`;
      }
      case 'a': {
        const href = el.getAttribute('href') || '';
        return `[${children}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'image';
        return `![${alt}](${src})`;
      }
      case 'hr':
        return '\n---\n\n';
      case 'mark':
        return `==${children}==`;
      case 'table':
        return processTable(el);
      default:
        return children;
    }
  }

  function processTable(table: HTMLElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let md = '';

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellContents = cells.map((cell) => cell.textContent?.trim() || '');

      md += '| ' + cellContents.join(' | ') + ' |\n';

      // Add header separator after first row
      if (rowIndex === 0) {
        md += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return md + '\n';
  }

  let markdown = processNode(temp);

  // Clean up extra whitespace
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

/**
 * Download a file to the user's computer
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Sanitize a filename for download
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent || '';
}

/**
 * Available export formats
 */
export type ExportFormat = 'pdf' | 'html' | 'markdown' | 'text';

export const EXPORT_FORMATS: { id: ExportFormat; label: string; extension: string }[] = [
  { id: 'pdf', label: 'PDF Document', extension: '.pdf' },
  { id: 'html', label: 'HTML Page', extension: '.html' },
  { id: 'markdown', label: 'Markdown', extension: '.md' },
  { id: 'text', label: 'Plain Text', extension: '.txt' },
];

/**
 * Export document in the specified format
 */
export function exportDocument(
  editor: Editor,
  title: string,
  format: ExportFormat
): void {
  switch (format) {
    case 'pdf':
      exportToPDF(editor, title);
      break;
    case 'html':
      exportToHTML(editor, title);
      break;
    case 'markdown':
      exportToMarkdown(editor, title);
      break;
    case 'text':
      exportToText(editor, title);
      break;
  }
}
