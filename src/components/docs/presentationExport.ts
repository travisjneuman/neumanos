/**
 * Presentation Export Utilities
 *
 * Export presentations to PDF and PPTX formats.
 * Uses lazy-loaded libraries to minimize bundle size.
 */

import type { Slide, SlideElement } from '../../types';

// Slide dimensions
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

/**
 * Convert slide background color to a safe format
 */
function getBackgroundColor(slide: Slide): string {
  if (slide.background.type === 'color' && slide.background.color) {
    return slide.background.color;
  }
  return '#FFFFFF';
}

/**
 * Get font family name for export
 */
function getFontFamily(fontFamily: string): string {
  // Map common web fonts to standard font names
  const fontMap: Record<string, string> = {
    'Inter': 'Arial',
    'Georgia': 'Georgia',
    'Arial': 'Arial',
    'Helvetica': 'Helvetica',
    'Times New Roman': 'Times New Roman',
  };
  return fontMap[fontFamily] || 'Arial';
}

/**
 * Export presentation to PDF
 */
export async function exportToPDF(
  slides: Slide[],
  title: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Lazy load jsPDF
  const { jsPDF } = await import('jspdf');

  // Create PDF in landscape with slide dimensions
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [SLIDE_WIDTH, SLIDE_HEIGHT],
    hotfixes: ['px_scaling'],
  });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, slides.length);

    // Add new page for slides after the first
    if (i > 0) {
      pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');
    }

    // Draw background
    const bgColor = getBackgroundColor(slide);
    pdf.setFillColor(bgColor);
    pdf.rect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, 'F');

    // Draw elements
    for (const element of slide.elements) {
      drawElementToPDF(pdf, element);
    }
  }

  // Save the PDF
  pdf.save(`${title}.pdf`);
}

/**
 * Draw a slide element to PDF
 */
function drawElementToPDF(pdf: import('jspdf').jsPDF, element: SlideElement): void {
  const { x, y, width, height, type } = element;

  switch (type) {
    case 'text':
      if (element.text) {
        const { content, fontSize, fontFamily, fontWeight, color, textAlign } = element.text;

        // Set font
        const style = fontWeight === 'bold' ? 'bold' : 'normal';
        pdf.setFont(getFontFamily(fontFamily), style);
        pdf.setFontSize(fontSize);

        // Set color
        pdf.setTextColor(color);

        // Calculate text position based on alignment
        let textX = x;
        if (textAlign === 'center') {
          textX = x + width / 2;
        } else if (textAlign === 'right') {
          textX = x + width;
        }

        // Draw text with word wrap
        const lines = pdf.splitTextToSize(content, width);
        pdf.text(lines, textX, y + fontSize, {
          align: textAlign as 'left' | 'center' | 'right',
          maxWidth: width,
        });
      }
      break;

    case 'shape':
      if (element.shape) {
        const { type: shapeType, fill, stroke, strokeWidth } = element.shape;

        // Set colors
        pdf.setFillColor(fill);
        pdf.setDrawColor(stroke);
        pdf.setLineWidth(strokeWidth);

        switch (shapeType) {
          case 'rectangle':
            pdf.rect(x, y, width, height, 'FD');
            break;
          case 'ellipse':
            pdf.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 'FD');
            break;
          case 'line':
            pdf.line(x, y + height / 2, x + width, y + height / 2);
            break;
          case 'arrow':
            // Draw arrow line
            pdf.line(x, y + height / 2, x + width - 10, y + height / 2);
            // Draw arrowhead
            const arrowX = x + width;
            const arrowY = y + height / 2;
            pdf.triangle(
              arrowX, arrowY,
              arrowX - 15, arrowY - 8,
              arrowX - 15, arrowY + 8,
              'F'
            );
            break;
          case 'triangle':
            pdf.triangle(
              x + width / 2, y,
              x, y + height,
              x + width, y + height,
              'FD'
            );
            break;
        }
      }
      break;

    case 'image':
      if (element.image?.src) {
        try {
          // Add image (data URL or external URL)
          pdf.addImage(element.image.src, 'JPEG', x, y, width, height);
        } catch {
          // If image fails, draw placeholder
          pdf.setFillColor('#CCCCCC');
          pdf.rect(x, y, width, height, 'F');
        }
      }
      break;
  }
}

/**
 * Export presentation to PPTX
 */
export async function exportToPPTX(
  slides: Slide[],
  title: string,
  _theme: unknown,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Lazy load PptxGenJS
  const PptxGenJS = (await import('pptxgenjs')).default;

  // Create presentation
  const pptx = new PptxGenJS();
  pptx.title = title;
  pptx.author = 'NeumanOS';
  pptx.subject = 'Presentation';

  // Set slide size (16:9)
  pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
  pptx.layout = 'CUSTOM';

  // Scale factors (PPTX uses inches, we use 1920x1080 pixels)
  const scaleX = 10 / SLIDE_WIDTH;
  const scaleY = 5.625 / SLIDE_HEIGHT;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    onProgress?.(i + 1, slides.length);

    // Add slide
    const pptSlide = pptx.addSlide();

    // Set background
    const bgColor = getBackgroundColor(slide);
    pptSlide.background = { color: bgColor.replace('#', '') };

    // Add elements
    for (const element of slide.elements) {
      addElementToPPTX(pptSlide, element, scaleX, scaleY);
    }
  }

  // Save the file
  await pptx.writeFile({ fileName: `${title}.pptx` });
}

/**
 * Add a slide element to PPTX slide
 * Using 'any' for slide parameter since pptxgenjs types are complex
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addElementToPPTX(
  slide: any,
  element: SlideElement,
  scaleX: number,
  scaleY: number
): void {
  const x = element.x * scaleX;
  const y = element.y * scaleY;
  const w = element.width * scaleX;
  const h = element.height * scaleY;

  switch (element.type) {
    case 'text':
      if (element.text) {
        const { content, fontSize, fontFamily, fontWeight, fontStyle, color, textAlign } = element.text;

        slide.addText(content, {
          x,
          y,
          w,
          h,
          fontSize: fontSize * 0.75, // Convert px to pt (approximate)
          fontFace: getFontFamily(fontFamily),
          bold: fontWeight === 'bold',
          italic: fontStyle === 'italic',
          color: color.replace('#', ''),
          align: textAlign,
          valign: 'top',
        });
      }
      break;

    case 'shape':
      if (element.shape) {
        const { type: shapeType, fill, stroke, strokeWidth } = element.shape;

        // Map shape types to PPTX shape types
        const shapeMap: Record<string, 'rect' | 'ellipse' | 'line' | 'triangle'> = {
          'rectangle': 'rect',
          'ellipse': 'ellipse',
          'line': 'line',
          'arrow': 'line',
          'triangle': 'triangle',
        };

        const pptxShape = shapeMap[shapeType] || 'rect';

        slide.addShape(pptxShape, {
          x,
          y,
          w,
          h,
          fill: { color: fill.replace('#', '') },
          line: {
            color: stroke.replace('#', ''),
            width: strokeWidth * 0.75, // Convert to pt
          },
        });
      }
      break;

    case 'image':
      if (element.image?.src) {
        try {
          slide.addImage({
            data: element.image.src,
            x,
            y,
            w,
            h,
          });
        } catch {
          // If image fails, add placeholder shape
          slide.addShape('rect', {
            x,
            y,
            w,
            h,
            fill: { color: 'CCCCCC' },
          });
        }
      }
      break;
  }
}
