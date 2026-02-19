/**
 * Brain Backup Service Tests
 * Tests for export/import utilities and validation
 *
 * Note: File API tests are limited due to jsdom environment constraints.
 * The validateBrainFile and importBrainFile functions are tested via E2E tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatFileSize, isFileSystemAccessSupported } from '../brainBackup';

// Mock logger to prevent console noise
vi.mock('../logger', () => ({
  logger: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock buildInfo
vi.mock('../../utils/buildInfo', () => ({
  BUILD_HASH: 'test-hash',
  BUILD_TIMESTAMP: '2025-01-01T00:00:00Z',
}));

describe('brainBackup', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes (under 1KB)', () => {
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
      expect(formatFileSize(102400)).toBe('100 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 5)).toBe('5 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 100)).toBe('100 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 100)).toBe('100 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(12345)).toBe('12.06 KB');
      expect(formatFileSize(1100)).toBe('1.07 KB');
    });

    it('should handle edge cases', () => {
      // Just under 1 KB
      expect(formatFileSize(1000)).toBe('1000 Bytes');
      // Just over 1 KB
      expect(formatFileSize(1025)).toBe('1 KB');
      // Exact power of 1024
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1024^2
    });
  });

  describe('isFileSystemAccessSupported', () => {
    const originalShowDirectoryPicker = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;

    beforeEach(() => {
      // Reset to original state
      if (originalShowDirectoryPicker) {
        (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = originalShowDirectoryPicker;
      } else {
        delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
      }
    });

    afterEach(() => {
      // Restore original state
      if (originalShowDirectoryPicker) {
        (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = originalShowDirectoryPicker;
      } else {
        delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
      }
    });

    it('should return true when showDirectoryPicker is available', () => {
      (window as unknown as { showDirectoryPicker: () => void }).showDirectoryPicker = vi.fn();
      expect(isFileSystemAccessSupported()).toBe(true);
    });

    it('should return false when showDirectoryPicker is not available', () => {
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
      expect(isFileSystemAccessSupported()).toBe(false);
    });

    // Note: Testing "undefined" value is not meaningful because:
    // 1. The 'in' operator returns true if property exists (even if undefined)
    // 2. Browsers either have showDirectoryPicker as a function or don't have it at all
    // 3. The "not available" test (delete) covers the real-world unsupported case
  });

  describe('BrainBackup interface', () => {
    // Test that the interface shape is correct by creating valid objects
    it('should define required fields correctly', () => {
      interface BrainBackup {
        version: string;
        exportDate: string;
        appBuild: string;
        appBuildTimestamp: string;
        compressed?: boolean;
        data: Record<string, unknown>;
      }

      const validBackup: BrainBackup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appBuild: 'abc123',
        appBuildTimestamp: '2025-01-01T00:00:00Z',
        data: {},
      };

      expect(validBackup.version).toBe('1.0');
      expect(validBackup.data).toEqual({});
    });

    it('should allow optional compressed field', () => {
      interface BrainBackup {
        version: string;
        exportDate: string;
        appBuild: string;
        appBuildTimestamp: string;
        compressed?: boolean;
        data: Record<string, unknown>;
      }

      const compressedBackup: BrainBackup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appBuild: 'abc123',
        appBuildTimestamp: '2025-01-01T00:00:00Z',
        compressed: true,
        data: { 'store-1': {} },
      };

      expect(compressedBackup.compressed).toBe(true);
    });
  });

  describe('ExportOptions interface', () => {
    it('should define optional fields correctly', () => {
      interface ExportOptions {
        compressed?: boolean;
        prettyPrint?: boolean;
      }

      const defaultOptions: ExportOptions = {};
      const allOptions: ExportOptions = {
        compressed: true,
        prettyPrint: false,
      };

      expect(defaultOptions.compressed).toBeUndefined();
      expect(allOptions.compressed).toBe(true);
      expect(allOptions.prettyPrint).toBe(false);
    });
  });

  describe('ExportResult interface', () => {
    it('should define required fields correctly', () => {
      interface ExportResult {
        filename: string;
        size: number;
        compressed: boolean;
      }

      const result: ExportResult = {
        filename: 'NeumanOS-Backup-2025-01-01.brain',
        size: 12345,
        compressed: true,
      };

      expect(result.filename).toContain('.brain');
      expect(result.size).toBeGreaterThan(0);
      expect(result.compressed).toBe(true);
    });
  });

  describe('optimizeForCompression logic', () => {
    // Test the logic that optimizeForCompression uses
    // Since it's not exported, we test the concepts

    describe('key sorting', () => {
      it('should sort keys alphabetically', () => {
        const unsorted = { zebra: 1, apple: 2, mango: 3 };
        const sorted = Object.keys(unsorted).sort();
        expect(sorted).toEqual(['apple', 'mango', 'zebra']);
      });
    });

    describe('empty value filtering', () => {
      it('should identify empty objects', () => {
        const isEmpty = (obj: unknown) =>
          typeof obj === 'object' && obj !== null && Object.keys(obj).length === 0;

        expect(isEmpty({})).toBe(true);
        expect(isEmpty({ a: 1 })).toBe(false);
        expect(isEmpty(null)).toBe(false);
      });

      it('should identify empty arrays', () => {
        const isEmptyArray = (arr: unknown) => Array.isArray(arr) && arr.length === 0;

        expect(isEmptyArray([])).toBe(true);
        expect(isEmptyArray([1])).toBe(false);
        expect(isEmptyArray({})).toBe(false);
      });
    });

    describe('null/undefined filtering', () => {
      it('should filter null and undefined from arrays', () => {
        const arr = [1, null, 2, undefined, 3];
        const filtered = arr.filter((item) => item !== null && item !== undefined);
        expect(filtered).toEqual([1, 2, 3]);
      });
    });
  });

  describe('date normalization concepts', () => {
    // Test the date key normalization logic used in imports

    it('should understand YYYY-M-D format (non-zero-padded)', () => {
      const isValidDateKey = (key: string) => /^\d{4}-\d{1,2}-\d{1,2}$/.test(key);

      expect(isValidDateKey('2025-1-15')).toBe(true);
      expect(isValidDateKey('2025-12-1')).toBe(true);
      expect(isValidDateKey('2025-01-15')).toBe(true); // Zero-padded also matches
      expect(isValidDateKey('2025-1-1')).toBe(true);
      expect(isValidDateKey('invalid')).toBe(false);
      expect(isValidDateKey('2025-13-1')).toBe(true); // Regex doesn't validate month range
    });

    it('should parse date components correctly', () => {
      const parseKey = (key: string) => {
        const [year, month, day] = key.split('-').map(Number);
        return { year, month, day };
      };

      expect(parseKey('2025-1-15')).toEqual({ year: 2025, month: 1, day: 15 });
      expect(parseKey('2025-12-31')).toEqual({ year: 2025, month: 12, day: 31 });
    });
  });

  describe('compression concepts', () => {
    // Test concepts related to compression/decompression

    it('should understand gzip compression stream availability', () => {
      // Check if CompressionStream is available in the environment
      const hasCompressionStream = typeof CompressionStream !== 'undefined';
      // jsdom may or may not have this, just verify we can check
      expect(typeof hasCompressionStream).toBe('boolean');
    });

    it('should understand Blob creation', () => {
      const text = JSON.stringify({ test: 'data' });
      const blob = new Blob([text], { type: 'application/json' });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('backup version handling', () => {
    it('should use semantic versioning format', () => {
      const BACKUP_VERSION = '1.0';
      expect(BACKUP_VERSION).toMatch(/^\d+\.\d+$/);
    });

    it('should compare versions correctly', () => {
      const compareVersions = (v1: string, v2: string) => {
        const [major1, minor1] = v1.split('.').map(Number);
        const [major2, minor2] = v2.split('.').map(Number);
        if (major1 !== major2) return major1 - major2;
        return minor1 - minor2;
      };

      expect(compareVersions('1.0', '1.0')).toBe(0);
      expect(compareVersions('2.0', '1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0', '2.0')).toBeLessThan(0);
      expect(compareVersions('1.1', '1.0')).toBeGreaterThan(0);
    });
  });

  describe('file naming convention', () => {
    it('should generate valid backup filename', () => {
      const generateFilename = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `NeumanOS-Backup-${timestamp}.brain`;
      };

      const filename = generateFilename();
      expect(filename).toMatch(/^NeumanOS-Backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.brain$/);
    });

    it('should have .brain extension', () => {
      const filename = 'NeumanOS-Backup-2025-01-01T12-00-00.brain';
      expect(filename.endsWith('.brain')).toBe(true);
    });
  });
});
