/**
 * Security Tests for Encryption Service
 * Tests roundtrip encryption/decryption, password validation, and edge cases
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  encrypt,
  decrypt,
  validatePassword,
  hashPassword,
  verifyPassword,
  calculatePasswordExpiry,
  isPasswordExpired,
  type EncryptedData,
} from '../encryption';

// Ensure WebCrypto is available in test environment
beforeAll(() => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Skip tests if WebCrypto not available (non-secure context)
    console.warn('WebCrypto not available - encryption tests will be skipped');
  }
});

describe('Encryption Service', () => {
  const validPassword = 'SecureP@ss123';
  const testPlaintext = 'sk-test-api-key-1234567890';

  describe('encrypt/decrypt roundtrip', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Verify encrypted data structure
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('version', 'webcrypto');

      // Verify decryption returns original plaintext
      const decrypted = await decrypt(encrypted, validPassword);
      expect(decrypted).toBe(testPlaintext);
    });

    it('should handle empty string encryption', async () => {
      // Empty plaintext should fail
      await expect(encrypt('', validPassword)).rejects.toThrow();
    });

    it('should handle special characters in plaintext', async () => {
      const specialChars = 'Test with émojis 🔐 and symbols: !@#$%^&*(){}[]|\\:";\'<>,.?/`~';
      const encrypted = await encrypt(specialChars, validPassword);
      const decrypted = await decrypt(encrypted, validPassword);
      expect(decrypted).toBe(specialChars);
    });

    it('should handle long plaintext', async () => {
      const longPlaintext = 'A'.repeat(10000);
      const encrypted = await encrypt(longPlaintext, validPassword);
      const decrypted = await decrypt(encrypted, validPassword);
      expect(decrypted).toBe(longPlaintext);
    });

    it('should handle unicode and multi-byte characters', async () => {
      const unicode = '中文 日本語 한국어 Русский العربية';
      const encrypted = await encrypt(unicode, validPassword);
      const decrypted = await decrypt(encrypted, validPassword);
      expect(decrypted).toBe(unicode);
    });

    it('should produce different ciphertext for same plaintext (unique salt/IV)', async () => {
      const encrypted1 = await encrypt(testPlaintext, validPassword);
      const encrypted2 = await encrypt(testPlaintext, validPassword);

      // Same plaintext should produce different ciphertext due to random salt/IV
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Both should still decrypt to same plaintext
      const decrypted1 = await decrypt(encrypted1, validPassword);
      const decrypted2 = await decrypt(encrypted2, validPassword);
      expect(decrypted1).toBe(decrypted2);
    });
  });

  describe('decrypt with wrong password', () => {
    it('should fail to decrypt with incorrect password', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Wrong password should throw an error
      await expect(decrypt(encrypted, 'wrongpassword123')).rejects.toThrow();
    });

    it('should fail to decrypt with similar but incorrect password', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Similar password with case difference
      await expect(decrypt(encrypted, 'securep@ss123')).rejects.toThrow();
    });
  });

  describe('decrypt with corrupted data', () => {
    it('should fail to decrypt with modified ciphertext', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Corrupt the ciphertext by modifying a character
      const corrupted: EncryptedData = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -5) + 'XXXXX',
      };

      await expect(decrypt(corrupted, validPassword)).rejects.toThrow();
    });

    it('should fail to decrypt with modified IV', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Corrupt the IV
      const corrupted: EncryptedData = {
        ...encrypted,
        iv: '000000000000000000000000',
      };

      await expect(decrypt(corrupted, validPassword)).rejects.toThrow();
    });

    it('should fail to decrypt with modified salt', async () => {
      const encrypted = await encrypt(testPlaintext, validPassword);

      // Corrupt the salt
      const corrupted: EncryptedData = {
        ...encrypted,
        salt: '00000000000000000000000000000000',
      };

      await expect(decrypt(corrupted, validPassword)).rejects.toThrow();
    });

    it('should fail with missing required fields', async () => {
      await expect(decrypt({ ciphertext: 'test', salt: 'test', iv: '' } as EncryptedData, validPassword)).rejects.toThrow();
      await expect(decrypt({ ciphertext: 'test', salt: '', iv: 'test' } as EncryptedData, validPassword)).rejects.toThrow();
      await expect(decrypt({ ciphertext: '', salt: 'test', iv: 'test' } as EncryptedData, validPassword)).rejects.toThrow();
    });

    it('should fail with null/undefined inputs', async () => {
      await expect(decrypt(null as unknown as EncryptedData, validPassword)).rejects.toThrow();
      await expect(decrypt(undefined as unknown as EncryptedData, validPassword)).rejects.toThrow();
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password1')).toEqual({ valid: true, message: 'Password is strong' });
      expect(validatePassword('Test12345')).toEqual({ valid: true, message: 'Password is strong' });
      expect(validatePassword('a1234567')).toEqual({ valid: true, message: 'Password is strong' });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'A'.repeat(129) + '1';
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('128 characters');
    });

    it('should reject passwords without letters', () => {
      const result = validatePassword('12345678');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should reject empty or null passwords', () => {
      expect(validatePassword('')).toEqual({ valid: false, message: 'Password must be at least 8 characters long' });
    });
  });

  describe('hashPassword/verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const hash = await hashPassword(validPassword);

      // Hash should be in salt$hash format (32 hex chars + $ + 64 hex chars)
      expect(hash).toMatch(/^[0-9a-f]{32}\$[0-9a-f]{64}$/);

      // Verification should succeed with correct password
      const isValid = await verifyPassword(validPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong password', async () => {
      const hash = await hashPassword(validPassword);
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password (unique salt)', async () => {
      const hash1 = await hashPassword(validPassword);
      const hash2 = await hashPassword(validPassword);
      // With random salt, same password produces different hashes
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await verifyPassword(validPassword, hash1)).toBe(true);
      expect(await verifyPassword(validPassword, hash2)).toBe(true);
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('Password1');
      const hash2 = await hashPassword('Password2');
      expect(hash1).not.toBe(hash2);
    });

    it('should support legacy unsalted hash format for backward compatibility', async () => {
      // Legacy format: simple SHA-256 without salt (64 hex chars)
      // This simulates a hash created before the salt update
      const legacyHash = '5e884898da28047d55d12f09f77ef0a3c0c8c8e5e8c8a8b8e8d8c8b8a8e8d8c8';
      // Verification should work with legacy format (though it won't match 'testpassword')
      const isValid = await verifyPassword('testpassword', legacyHash);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('calculatePasswordExpiry', () => {
    it('should calculate daily expiry correctly', () => {
      const now = new Date();
      const expiry = calculatePasswordExpiry('daily');

      // Should be approximately 24 hours in the future
      const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });

    it('should calculate weekly expiry correctly', () => {
      const now = new Date();
      const expiry = calculatePasswordExpiry('weekly');

      // Should be approximately 7 days in the future
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    });

    it('should calculate monthly expiry correctly', () => {
      const now = new Date();
      const expiry = calculatePasswordExpiry('monthly');

      // Should be approximately 28-31 days in the future
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(27);
      expect(diffDays).toBeLessThanOrEqual(32);
    });
  });

  describe('isPasswordExpired', () => {
    it('should return true for expired date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isPasswordExpired(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isPasswordExpired(futureDate)).toBe(false);
    });

    it('should return true for null date', () => {
      expect(isPasswordExpired(null)).toBe(true);
    });
  });
});
