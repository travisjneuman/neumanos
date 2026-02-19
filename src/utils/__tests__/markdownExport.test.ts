/**
 * Markdown Export Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  exportNoteToMarkdown,
  getMarkdownFilename,
  isValidMarkdown,
  exportTaskToMarkdown,
  exportTasksToMarkdown,
  buildFolderPath,
  createMarkdownZip,
  getExportFilename,
} from '../markdownExport';
import type { Note, Folder } from '../../types/notes';
import type { Task } from '../../types';

describe('markdownExport', () => {
  describe('exportNoteToMarkdown', () => {
    it('should convert note with simple content to markdown', () => {
      const note: Note = {
        id: 'test-1',
        title: 'Test Note',
        content: '',
        contentText: 'Simple note content',
        tags: ['test'],
        projectIds: [],
        createdAt: new Date('2025-12-01T12:00:00Z'),
        updatedAt: new Date('2025-12-01T14:00:00Z'),
        isPinned: false,
        isArchived: false,
        folderId: null,
      };

      const markdown = exportNoteToMarkdown(note, {});

      expect(markdown).toContain('---');
      expect(markdown).toContain('title: "Test Note"');
      expect(markdown).toContain('tags: ["test"]');
      expect(markdown).toContain('Simple note content');
    });

    it('should preserve wiki links in markdown output', () => {
      const note: Note = {
        id: 'test-2',
        title: 'Note with Links',
        content: '',
        contentText: 'This has [[Another Note]] and [[Second Note]] links.',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
        folderId: null,
      };

      const markdown = exportNoteToMarkdown(note, {});

      expect(markdown).toContain('[[Another Note]]');
      expect(markdown).toContain('[[Second Note]]');
    });

    it('should include folder name in frontmatter when folder exists', () => {
      const folders: Folder[] = [
        {
          id: 'folder-1',
          name: 'Work',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
      ];

      const note: Note = {
        id: 'test-3',
        title: 'Work Note',
        content: '',
        contentText: 'Work content',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
        folderId: 'folder-1',
      };

      const markdown = exportNoteToMarkdown(note, {}, folders);

      expect(markdown).toContain('folder: "Work"');
    });

    it('should include pinned and favorite flags when true', () => {
      const note: Note = {
        id: 'test-4',
        title: 'Special Note',
        content: '',
        contentText: 'Content',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: true,
        isArchived: false,
        isFavorite: true,
        folderId: null,
      };

      const markdown = exportNoteToMarkdown(note, {});

      expect(markdown).toContain('pinned: true');
      expect(markdown).toContain('favorite: true');
    });
  });

  describe('getMarkdownFilename', () => {
    it('should generate valid filename from note title', () => {
      const note: Note = {
        id: 'test-1',
        title: 'My Note Title',
        content: '',
        contentText: '',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
        folderId: null,
      };

      const filename = getMarkdownFilename(note);

      expect(filename).toBe('My-Note-Title.md');
    });

    it('should sanitize special characters from filename', () => {
      const note: Note = {
        id: 'test-2',
        title: 'Note: With/Special\\Characters?',
        content: '',
        contentText: '',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
        folderId: null,
      };

      const filename = getMarkdownFilename(note);

      expect(filename).not.toContain(':');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('\\');
      expect(filename).not.toContain('?');
      expect(filename).toContain('.md');
    });

    it('should truncate long filenames to 255 characters', () => {
      const longTitle = 'A'.repeat(300);
      const note: Note = {
        id: 'test-3',
        title: longTitle,
        content: '',
        contentText: '',
        tags: [],
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        isArchived: false,
        folderId: null,
      };

      const filename = getMarkdownFilename(note);

      expect(filename.length).toBeLessThanOrEqual(255);
      expect(filename).toContain('.md');
    });
  });

  describe('isValidMarkdown', () => {
    it('should validate markdown with frontmatter', () => {
      const markdown = `---
title: "Test"
created: "2025-12-01"
---

# Content`;

      expect(isValidMarkdown(markdown)).toBe(true);
    });

    it('should validate markdown without frontmatter', () => {
      const markdown = '# Just a heading\n\nWith some content.';

      expect(isValidMarkdown(markdown)).toBe(true);
    });

    it('should reject empty markdown', () => {
      expect(isValidMarkdown('')).toBe(false);
      expect(isValidMarkdown('   ')).toBe(false);
    });

    it('should reject markdown with only frontmatter and no content', () => {
      const markdown = `---
title: "Test"
---`;

      expect(isValidMarkdown(markdown)).toBe(false);
    });
  });

  describe('exportTaskToMarkdown', () => {
    it('should export task with frontmatter and metadata', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Task description',
        status: 'todo',
        priority: 'high',
        created: '2025-12-01T12:00:00Z',
        startDate: '2025-12-02',
        dueDate: '2025-12-15',
        tags: ['work', 'urgent'],
        cardNumber: 42,
        projectIds: [],
      };

      const markdown = exportTaskToMarkdown(task);

      expect(markdown).toContain('---');
      expect(markdown).toContain('title: "Test Task"');
      expect(markdown).toContain('status: "todo"');
      expect(markdown).toContain('priority: "high"');
      expect(markdown).toContain('start-date: "2025-12-02"');
      expect(markdown).toContain('due-date: "2025-12-15"');
      expect(markdown).toContain('card-number: "KAN-42"');
      expect(markdown).toContain('## Description');
      expect(markdown).toContain('Task description');
      expect(markdown).toContain('## Metadata');
    });

    it('should include checklist items when present', () => {
      const task: Task = {
        id: 'task-2',
        title: 'Task with Checklist',
        description: '',
        status: 'inprogress',
        priority: 'medium',
        created: '2025-12-01',
        startDate: null,
        dueDate: null,
        tags: [],
        checklist: [
          { id: '1', text: 'Item 1', completed: true, order: 0, createdAt: '2025-12-01' },
          { id: '2', text: 'Item 2', completed: false, order: 1, createdAt: '2025-12-01' },
        ],
        projectIds: [],
      };

      const markdown = exportTaskToMarkdown(task);

      expect(markdown).toContain('## Checklist');
      expect(markdown).toContain('[x] Item 1');
      expect(markdown).toContain('[ ] Item 2');
    });
  });

  describe('exportTasksToMarkdown', () => {
    it('should group tasks by status', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Backlog Task',
          description: '',
          status: 'backlog',
          priority: 'low',
          created: '2025-12-01',
          startDate: null,
          dueDate: null,
          tags: [],
          projectIds: [],
        },
        {
          id: 'task-2',
          title: 'Todo Task',
          description: '',
          status: 'todo',
          priority: 'medium',
          created: '2025-12-01',
          startDate: null,
          dueDate: null,
          tags: [],
          projectIds: [],
        },
        {
          id: 'task-3',
          title: 'Done Task',
          description: '',
          status: 'done',
          priority: 'high',
          created: '2025-12-01',
          startDate: null,
          dueDate: null,
          tags: [],
          projectIds: [],
        },
      ];

      const markdown = exportTasksToMarkdown(tasks);

      expect(markdown).toContain('# Tasks Export');
      expect(markdown).toContain('## Table of Contents');
      expect(markdown).toContain('## Backlog');
      expect(markdown).toContain('## To Do');
      expect(markdown).toContain('## Done');
      expect(markdown).toContain('### Backlog Task');
      expect(markdown).toContain('### Todo Task');
      expect(markdown).toContain('### Done Task');
    });
  });

  describe('buildFolderPath', () => {
    it('should return "notes" for root folder (null folderId)', () => {
      const path = buildFolderPath(null, []);
      expect(path).toBe('notes');
    });

    it('should build path for single folder', () => {
      const folders: Folder[] = [
        {
          id: 'folder-1',
          name: 'Work',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
      ];

      const path = buildFolderPath('folder-1', folders);
      expect(path).toBe('notes/Work');
    });

    it('should build path for nested folders', () => {
      const folders: Folder[] = [
        {
          id: 'folder-1',
          name: 'Work',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
        {
          id: 'folder-2',
          name: 'Projects',
          parentId: 'folder-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
        {
          id: 'folder-3',
          name: 'Active',
          parentId: 'folder-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
      ];

      const path = buildFolderPath('folder-3', folders);
      expect(path).toBe('notes/Work/Projects/Active');
    });

    it('should sanitize folder names with special characters', () => {
      const folders: Folder[] = [
        {
          id: 'folder-1',
          name: 'Work: Projects/Active',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isExpanded: true,
        },
      ];

      const path = buildFolderPath('folder-1', folders);
      // Should sanitize : and / from folder name (but path will still have / as separator)
      expect(path).toBe('notes/Work-ProjectsActive');
    });
  });

  describe('createMarkdownZip', () => {
    it('should create ZIP blob from files', async () => {
      const files = [
        { path: 'notes/test.md', content: '# Test Note\n\nContent' },
        { path: 'tasks/tasks.md', content: '# Tasks\n\n- Task 1' },
      ];

      const blob = await createMarkdownZip(files);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/zip');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('getExportFilename', () => {
    it('should generate filename with date and time', () => {
      const filename = getExportFilename();

      expect(filename).toMatch(/^neumanos-export-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
      expect(filename).toContain('.zip');
    });
  });
});
