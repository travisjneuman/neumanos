/**
 * DocViewer Component
 *
 * Renders markdown content with syntax highlighting and site styling.
 * Used for displaying platform documentation in the Docs page.
 *
 * Features:
 * - GitHub-flavored markdown (tables, task lists, strikethrough)
 * - Syntax highlighting for code blocks
 * - Responsive typography matching site design system
 * - Auto-linking of headings for navigation
 * - Copy button for code blocks
 */

import { memo, useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface DocViewerProps {
  /** Markdown content to render */
  content: string;
  /** Document title (optional, will use first H1 if not provided) */
  title?: string;
  /** Callback when a heading is clicked (for navigation) */
  onHeadingClick?: (id: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Code block with copy button
 */
function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Extract text content from children
    let code = '';
    if (typeof children === 'string') {
      code = children;
    } else if (children && typeof children === 'object') {
      const childElement = children as React.ReactElement<{ children?: React.ReactNode }>;
      code = String(childElement.props?.children || '');
    }

    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative group">
      <pre className={className}>
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark opacity-0 group-hover:opacity-100 transition-opacity"
        title={copied ? 'Copied!' : 'Copy code'}
        aria-label={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-status-success" />
        ) : (
          <Copy className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        )}
      </button>
    </div>
  );
}

/**
 * Generate a URL-friendly slug from text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * DocViewer component for rendering markdown documentation
 */
export const DocViewer = memo(function DocViewer({
  content,
  title,
  onHeadingClick,
  className = '',
}: DocViewerProps) {
  // Track headings for potential table of contents (future feature)
  const [_headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Extract headings from content on mount
  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings: { id: string; text: string; level: number }[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      extractedHeadings.push({
        id: slugify(match[2]),
        text: match[2],
        level: match[1].length,
      });
    }

    setHeadings(extractedHeadings);
  }, [content]);

  return (
    <article
      className={`doc-viewer prose prose-slate dark:prose-invert max-w-none ${className}`}
    >
      {/* Custom title if provided and different from first H1 */}
      {title && !content.trim().startsWith('# ' + title) && (
        <h1 className="text-3xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">
          {title}
        </h1>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            code: [...(defaultSchema.attributes?.code || []), ['className']],
            span: [...(defaultSchema.attributes?.span || []), ['className']],
          },
        }], rehypeHighlight]}
        components={{
          // Headings with anchor links
          h1: ({ children, ...props }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h1
                id={id}
                className="text-3xl font-bold mt-8 mb-4 text-text-light-primary dark:text-text-dark-primary scroll-mt-20 group"
                {...props}
              >
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onHeadingClick?.(id);
                    window.history.replaceState(null, '', `#${id}`);
                  }}
                  className="no-underline hover:underline"
                >
                  {children}
                </a>
              </h1>
            );
          },
          h2: ({ children, ...props }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h2
                id={id}
                className="text-2xl font-semibold mt-8 mb-3 text-text-light-primary dark:text-text-dark-primary scroll-mt-20 group"
                {...props}
              >
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onHeadingClick?.(id);
                    window.history.replaceState(null, '', `#${id}`);
                  }}
                  className="no-underline hover:underline"
                >
                  {children}
                </a>
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h3
                id={id}
                className="text-xl font-semibold mt-6 mb-2 text-text-light-primary dark:text-text-dark-primary scroll-mt-20"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4: ({ children, ...props }) => (
            <h4
              className="text-lg font-semibold mt-4 mb-2 text-text-light-primary dark:text-text-dark-primary"
              {...props}
            >
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5
              className="text-base font-semibold mt-4 mb-1 text-text-light-primary dark:text-text-dark-primary"
              {...props}
            >
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6
              className="text-sm font-semibold mt-4 mb-1 text-text-light-secondary dark:text-text-dark-secondary"
              {...props}
            >
              {children}
            </h6>
          ),

          // Paragraphs
          p: ({ children, ...props }) => (
            <p
              className="my-4 text-text-light-secondary dark:text-text-dark-secondary leading-relaxed"
              {...props}
            >
              {children}
            </p>
          ),

          // Links
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-accent-primary hover:text-accent-primary/80 underline underline-offset-2 inline-flex items-center gap-1"
                {...props}
              >
                {children}
                {isExternal && <ExternalLink className="w-3 h-3 inline" />}
              </a>
            );
          },

          // Lists
          ul: ({ children, ...props }) => (
            <ul
              className="my-4 ml-6 list-disc text-text-light-secondary dark:text-text-dark-secondary"
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className="my-4 ml-6 list-decimal text-text-light-secondary dark:text-text-dark-secondary"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="my-1" {...props}>
              {children}
            </li>
          ),

          // Code blocks
          pre: ({ children }) => (
            <CodeBlock className="my-4 p-4 rounded-lg bg-surface-light-alt dark:bg-surface-dark overflow-x-auto text-sm font-mono">
              {children}
            </CodeBlock>
          ),

          // Inline code
          code: ({ children, className, ...props }) => {
            // If it has a className, it's part of a code block (handled by pre)
            if (className) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-surface-light-alt dark:bg-surface-dark-elevated text-accent-primary font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-4 pl-4 border-l-4 border-accent-primary/50 italic text-text-light-secondary dark:text-text-dark-secondary"
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="w-full border-collapse border border-border-light dark:border-border-dark"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead
              className="bg-surface-light-alt dark:bg-surface-dark"
              {...props}
            >
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-2 text-left font-semibold border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-4 py-2 border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary"
              {...props}
            >
              {children}
            </td>
          ),

          // Horizontal rules
          hr: () => (
            <hr className="my-8 border-t border-border-light dark:border-border-dark" />
          ),

          // Images
          img: ({ src, alt, ...props }) => {
            // Transform paths starting with "public/" to work in Vite's dev server
            // In Vite, public/ contents are served from the root, so "public/images/x.png" -> "/images/x.png"
            let imageSrc = src || '';
            if (imageSrc.startsWith('public/')) {
              imageSrc = imageSrc.replace(/^public\//, '/');
            }
            return (
              <img
                src={imageSrc}
                alt={alt || ''}
                className="my-4 max-w-full h-auto rounded-lg"
                loading="lazy"
                {...props}
              />
            );
          },

          // Task lists (GFM)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 accent-primary"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },

          // Strong/Bold
          strong: ({ children, ...props }) => (
            <strong
              className="font-semibold text-text-light-primary dark:text-text-dark-primary"
              {...props}
            >
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),

          // Strikethrough (GFM)
          del: ({ children, ...props }) => (
            <del className="line-through opacity-70" {...props}>
              {children}
            </del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Add some bottom padding for comfortable reading */}
      <div className="h-16" aria-hidden="true" />
    </article>
  );
});

export default DocViewer;
