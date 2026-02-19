/**
 * Note Export Service
 * Handles exporting notes to various formats (Markdown, PDF, etc.)
 */

import type { Note } from '../types/notes';

/**
 * Convert Lexical JSON to Markdown
 * Basic implementation - can be enhanced later
 */
export const lexicalToMarkdown = (content: string): string => {
  try {
    const editorState = JSON.parse(content);
    const root = editorState.root;

    if (!root || !root.children) {
      return '';
    }

    let markdown = '';

    const processNode = (node: any, depth = 0): string => {
      let result = '';

      switch (node.type) {
        case 'heading':
          const level = node.tag === 'h1' ? '# ' : node.tag === 'h2' ? '## ' : '### ';
          result += level + (node.children?.map((c: any) => c.text || '').join('') || '') + '\n\n';
          break;

        case 'paragraph':
          const text = node.children?.map((c: any) => {
            let t = c.text || '';
            if (c.format & 1) t = `**${t}**`; // Bold
            if (c.format & 2) t = `*${t}*`; // Italic
            if (c.format & 8) t = `\`${t}\``; // Code
            return t;
          }).join('') || '';
          result += text + '\n\n';
          break;

        case 'list':
          node.children?.forEach((item: any, index: number) => {
            const prefix = node.listType === 'number' ? `${index + 1}. ` : '- ';
            const itemText = item.children?.map((c: any) => c.text || '').join('') || '';
            result += prefix + itemText + '\n';
          });
          result += '\n';
          break;

        case 'quote':
          const quoteText = node.children?.map((c: any) => c.text || '').join('') || '';
          result += '> ' + quoteText + '\n\n';
          break;

        case 'code':
          const codeText = node.children?.map((c: any) => c.text || '').join('') || '';
          result += '```\n' + codeText + '\n```\n\n';
          break;

        case 'link':
          const linkText = node.children?.map((c: any) => c.text || '').join('') || '';
          result += `[${linkText}](${node.url})`;
          break;

        case 'text':
          return node.text || '';

        default:
          // Recursively process children
          if (node.children) {
            node.children.forEach((child: any) => {
              result += processNode(child, depth + 1);
            });
          }
          break;
      }

      return result;
    };

    root.children.forEach((child: any) => {
      markdown += processNode(child);
    });

    return markdown.trim();
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    return '';
  }
};

/**
 * Export single note to Markdown file
 */
export const exportNoteToMarkdown = (note: Note): void => {
  const markdown = lexicalToMarkdown(note.content);

  // Create markdown file content with metadata
  const fileContent = `# ${note.title || 'Untitled'}\n\n${markdown}`;

  // Create blob and download
  const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${note.title || 'Untitled'}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export multiple notes to Markdown (bulk export)
 */
export const exportNotesToMarkdown = (notes: Note[]): void => {
  notes.forEach((note) => {
    exportNoteToMarkdown(note);
  });
};

/**
 * Get plain text from Lexical JSON (for PDF export)
 */
export const lexicalToPlainText = (content: string): string => {
  try {
    const editorState = JSON.parse(content);
    const root = editorState.root;

    if (!root || !root.children) {
      return '';
    }

    let text = '';

    const processNode = (node: any): string => {
      if (node.text) {
        return node.text;
      }

      if (node.children) {
        return node.children.map((child: any) => processNode(child)).join('');
      }

      return '';
    };

    root.children.forEach((child: any) => {
      text += processNode(child) + '\n\n';
    });

    return text.trim();
  } catch (error) {
    console.error('Error converting to plain text:', error);
    return '';
  }
};
