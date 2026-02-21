/**
 * Enhanced Code Block Component
 * Renders code blocks in AI responses with:
 * - Syntax highlighting via CSS classes
 * - Copy button
 * - Language label
 * - Line numbers for longer blocks
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

/**
 * Line number threshold: show line numbers for blocks with more than this many lines
 */
const LINE_NUMBER_THRESHOLD = 5;

/**
 * Normalize language identifiers from markdown fences
 */
function normalizeLanguage(raw: string | undefined): string {
  if (!raw) return 'text';
  const lang = raw.toLowerCase().replace(/^language-/, '');

  const aliases: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    dockerfile: 'docker',
  };

  return aliases[lang] ?? lang;
}

/**
 * Lightweight token-based syntax highlighter
 * Applies CSS classes for common code patterns without a heavy library
 */
function highlightCode(code: string, language: string): React.ReactNode[] {
  // For plain text, return as-is
  if (language === 'text' || language === 'plain') {
    return [code];
  }

  const lines = code.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && '\n'}
      <HighlightedLine line={line} language={language} />
    </React.Fragment>
  ));
}

/**
 * Highlight a single line of code using regex-based tokenization
 */
const HighlightedLine: React.FC<{ line: string; language: string }> = React.memo(({ line, language }) => {
  const tokens = useMemo(() => tokenizeLine(line, language), [line, language]);

  return (
    <>
      {tokens.map((token, i) => (
        token.type === 'plain'
          ? <React.Fragment key={i}>{token.value}</React.Fragment>
          : <span key={i} className={`token-${token.type}`}>{token.value}</span>
      ))}
    </>
  );
});

HighlightedLine.displayName = 'HighlightedLine';

interface Token {
  type: 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'type' | 'property';
  value: string;
}

/**
 * Tokenize a line of code for syntax highlighting
 */
function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  const keywords = getKeywords(language);
  const typeKeywords = getTypeKeywords(language);

  // Combined regex for all token types
  const patterns: Array<{ regex: RegExp; type: Token['type'] }> = [
    // Comments (single-line)
    { regex: /^(\/\/.*|#.*)/, type: 'comment' },
    // Strings (double-quoted, single-quoted, template literals)
    { regex: /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/, type: 'string' },
    // Numbers
    { regex: /^(\b\d+\.?\d*(?:e[+-]?\d+)?\b)/, type: 'number' },
    // Function calls
    { regex: /^(\b[a-zA-Z_]\w*)\s*(?=\()/, type: 'function' },
    // Type annotations (after :)
    { regex: /^(\b(?:string|number|boolean|void|null|undefined|never|unknown|Promise|Array|Record|Map|Set)\b)/, type: 'type' },
    // Operators
    { regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|^~]+)/, type: 'operator' },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, type } of patterns) {
      const match = remaining.match(regex);
      if (match) {
        tokens.push({ type, value: match[0] });
        remaining = remaining.substring(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check for keywords / type keywords
      const wordMatch = remaining.match(/^(\b[a-zA-Z_]\w*\b)/);
      if (wordMatch) {
        const word = wordMatch[1];
        if (keywords.has(word)) {
          tokens.push({ type: 'keyword', value: word });
        } else if (typeKeywords.has(word)) {
          tokens.push({ type: 'type', value: word });
        } else {
          tokens.push({ type: 'plain', value: word });
        }
        remaining = remaining.substring(word.length);
      } else {
        // Single character - add to plain text
        const lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === 'plain') {
          lastToken.value += remaining[0];
        } else {
          tokens.push({ type: 'plain', value: remaining[0] });
        }
        remaining = remaining.substring(1);
      }
    }
  }

  return tokens;
}

function getKeywords(language: string): Set<string> {
  const common = new Set(['if', 'else', 'for', 'while', 'return', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of']);

  const langSpecific: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'yield', 'this', 'super', 'true', 'false', 'null', 'undefined'],
    typescript: ['const', 'let', 'var', 'function', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'yield', 'this', 'super', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum', 'implements', 'abstract', 'readonly', 'declare', 'as', 'is', 'keyof', 'infer'],
    python: ['def', 'class', 'import', 'from', 'as', 'with', 'assert', 'yield', 'lambda', 'pass', 'raise', 'global', 'nonlocal', 'and', 'or', 'not', 'is', 'True', 'False', 'None', 'self', 'async', 'await'],
    rust: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'pub', 'self', 'super', 'crate', 'match', 'loop', 'move', 'ref', 'async', 'await', 'dyn', 'where', 'true', 'false'],
    go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'package', 'import', 'range', 'go', 'chan', 'select', 'defer', 'map', 'make', 'append', 'len', 'nil', 'true', 'false', 'iota'],
    bash: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'export', 'local', 'readonly', 'shift', 'trap'],
    css: ['@import', '@media', '@keyframes', '@font-face', '@supports', 'important'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'INTO', 'VALUES', 'SET'],
  };

  const extra = langSpecific[language] ?? langSpecific['javascript'] ?? [];
  return new Set([...common, ...extra]);
}

function getTypeKeywords(language: string): Set<string> {
  const types: Record<string, string[]> = {
    typescript: ['string', 'number', 'boolean', 'void', 'null', 'undefined', 'never', 'unknown', 'any', 'object', 'symbol', 'bigint', 'Promise', 'Array', 'Record', 'Map', 'Set', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit'],
    javascript: ['Promise', 'Array', 'Map', 'Set', 'Object', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt'],
    rust: ['i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc'],
    python: ['int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'bytes', 'None'],
    go: ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'float32', 'float64', 'bool', 'string', 'byte', 'rune', 'error'],
  };
  return new Set(types[language] ?? []);
}

/**
 * Enhanced CodeBlock component
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language: rawLanguage, className }) => {
  const [copied, setCopied] = useState(false);
  const language = normalizeLanguage(rawLanguage || className?.replace('language-', ''));
  const code = typeof children === 'string' ? children.trimEnd() : String(children).trimEnd();
  const lines = code.split('\n');
  const showLineNumbers = lines.length > LINE_NUMBER_THRESHOLD;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);

  return (
    <div className="code-block-wrapper group relative rounded-lg overflow-hidden my-2 border border-border-dark">
      {/* Header: Language label + Copy button */}
      <div className="flex items-center justify-between px-3 py-1 bg-surface-dark-elevated border-b border-border-dark">
        <span className="text-[10px] font-mono text-text-dark-tertiary uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded transition-all text-text-dark-secondary hover:text-white hover:bg-surface-dark"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check size={12} className="text-accent-green" />
              <span className="text-accent-green">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-3 m-0 text-xs leading-relaxed bg-[#0a0a0f]">
          {showLineNumbers ? (
            <table className="border-collapse w-full">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="select-none pr-4 text-right text-text-dark-tertiary/40 font-mono align-top w-8 border-r border-border-dark/30 mr-3">
                      {i + 1}
                    </td>
                    <td className="pl-3 font-mono whitespace-pre">
                      <HighlightedLine line={line} language={language} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <code className="font-mono whitespace-pre">{highlighted}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
