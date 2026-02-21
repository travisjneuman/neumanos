/**
 * Vite Plugin: Platform Docs Loader
 *
 * Extracts markdown documentation from source files at build time
 * and makes them available as a virtual module for the Docs page.
 *
 * Platform docs are read-only, bundled with the app, and include:
 * - README.md (Getting Started)
 * - docs/*.md (User guides for features)
 *
 * Excludes:
 * - docs/technical/* (developer docs)
 * - tasks/* (internal tasks)
 */

import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

interface PlatformDoc {
  id: string;
  title: string;
  path: string;
  category: string;
  order: number;
  content: string;
}

interface PlatformDocsConfig {
  /** Root directory to search for docs (relative to project root) */
  rootDir?: string;
  /** Patterns to include */
  include?: string[];
  /** Patterns to exclude */
  exclude?: string[];
}

const DEFAULT_CONFIG: Required<PlatformDocsConfig> = {
  rootDir: '.',
  include: [
    'README.md',
    'docs/*.md',
  ],
  exclude: [
    '**/CLAUDE.md',
    '**/research/**',
    '**/technical/**',
    '**/testing/**',
    '**/.archive/**',
    '**/tasks/**',
  ],
};

/**
 * Extract a clean title from markdown content.
 * Looks for the first H1 heading or uses the filename.
 */
function extractTitle(content: string, filePath: string): string {
  // Try to find first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to filename without extension
  const basename = path.basename(filePath, '.md');
  // Convert kebab-case or snake_case to Title Case
  return basename
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Determine category from file path
 */
function getCategory(filePath: string): string {
  if (filePath === 'README.md') return 'getting-started';
  if (filePath.includes('docs/')) return 'user-guides';
  return 'other';
}

/**
 * Generate a stable ID from file path
 */
function generateId(filePath: string): string {
  return filePath
    .replace(/\.md$/, '')
    .replace(/[/\\]/g, '-')
    .replace(/^docs-/, '')
    .toLowerCase();
}

/**
 * Explicit ordering for docs displayed in-app.
 * README is always first (order 0), then guides follow
 * a logical progression from onboarding → core features → advanced → reference.
 */
const DOC_ORDER: Record<string, number> = {
  'getting-started': 1,
  'dashboard-widgets': 2,
  'notes-editor': 3,
  'tasks-kanban': 4,
  'time-tracking': 5,
  'calendar-events': 6,
  'ai-terminal': 7,
  'terminal-complete': 8,
  'automation': 9,
  'keyboard-shortcuts': 10,
  'backup-sync': 11,
  'privacy-security': 12,
  'backend-proxy-setup': 13,
  'troubleshooting': 14,
};

function getOrder(filePath: string): number {
  if (filePath === 'README.md') return 0;

  const basename = path.basename(filePath, '.md');
  return DOC_ORDER[basename] ?? 100;
}

/**
 * Simple glob pattern matcher
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/\\\\]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Recursively find markdown files matching patterns
 */
function findMarkdownFiles(
  rootDir: string,
  include: string[],
  exclude: string[]
): string[] {
  const files: string[] = [];

  // Process include patterns
  for (const pattern of include) {
    if (pattern.includes('*')) {
      // Glob pattern - find matching files
      const baseDir = path.join(rootDir, pattern.split('*')[0]);
      if (fs.existsSync(baseDir)) {
        const dirFiles = fs.readdirSync(baseDir);
        for (const file of dirFiles) {
          if (file.endsWith('.md')) {
            const relativePath = path
              .join(pattern.split('*')[0], file)
              .replace(/\\/g, '/');
            const fullPath = path.join(rootDir, relativePath);
            if (
              fs.existsSync(fullPath) &&
              !exclude.some((ex) => matchesPattern(relativePath, ex))
            ) {
              files.push(relativePath);
            }
          }
        }
      }
    } else {
      // Exact file path
      const fullPath = path.join(rootDir, pattern);
      if (
        fs.existsSync(fullPath) &&
        !exclude.some((ex) => matchesPattern(pattern, ex))
      ) {
        files.push(pattern);
      }
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Load and parse platform docs
 */
function loadPlatformDocs(rootDir: string, config: Required<PlatformDocsConfig>): PlatformDoc[] {
  const files = findMarkdownFiles(rootDir, config.include, config.exclude);
  const docs: PlatformDoc[] = [];

  for (const filePath of files) {
    const fullPath = path.join(rootDir, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const category = getCategory(filePath);

      docs.push({
        id: generateId(filePath),
        title: extractTitle(content, filePath),
        path: filePath,
        category,
        order: getOrder(filePath),
        content,
      });
    } catch (error) {
      console.warn(`[platform-docs] Failed to read ${filePath}:`, error);
    }
  }

  // Sort by order, then alphabetically by title
  return docs.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

const VIRTUAL_MODULE_ID = 'virtual:platform-docs';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

/**
 * Vite plugin for loading platform documentation at build time
 */
export function platformDocsPlugin(config: PlatformDocsConfig = {}): Plugin {
  const mergedConfig: Required<PlatformDocsConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let projectRoot = '';

  return {
    name: 'vite-plugin-platform-docs',

    configResolved(resolvedConfig) {
      projectRoot = resolvedConfig.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const rootDir = path.join(projectRoot, mergedConfig.rootDir);
        const docs = loadPlatformDocs(rootDir, mergedConfig);

        // Generate the virtual module code
        return `
// Auto-generated by vite-plugin-platform-docs
// This module exports all platform documentation bundled at build time

export const platformDocs = ${JSON.stringify(docs, null, 2)};

export const platformDocsMeta = platformDocs.map(({ content, ...meta }) => meta);

export function getPlatformDoc(id) {
  return platformDocs.find(doc => doc.id === id);
}

export function getPlatformDocsByCategory(category) {
  return platformDocs.filter(doc => doc.category === category);
}

export default platformDocs;
`;
      }
    },

    // Watch for changes in dev mode
    configureServer(server) {
      const rootDir = path.join(projectRoot, mergedConfig.rootDir);

      // Watch docs directories
      const watchPaths = ['README.md', 'docs'];
      for (const watchPath of watchPaths) {
        const fullPath = path.join(rootDir, watchPath);
        if (fs.existsSync(fullPath)) {
          server.watcher.add(fullPath);
        }
      }

      // Invalidate virtual module on doc changes
      server.watcher.on('change', (file) => {
        if (file.endsWith('.md')) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
        }
      });
    },
  };
}

export default platformDocsPlugin;
