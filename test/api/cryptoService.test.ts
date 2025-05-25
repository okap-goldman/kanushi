import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CryptoService } from '@/lib/cryptoService';

// Mock Web Crypto API for Node.js environment
if (typeof global !== 'undefined' && !global.crypto) {
  const { webcrypto } = await import('crypto');
  global.crypto = webcrypto as any;
}

describe('Crypto Service', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    vi.clearAllMocks();
    cryptoService = new CryptoService();
  });

  describe('Key Generation', () => {
    it('RSA鍵ペアを生成できる', async () => {
      // Act
      const keyPair = await cryptoService.generateKeyPair();

      // Assert
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(keyPair.publicKey).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64
      expect(keyPair.privateKey).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64
    });
  });

  describe('Message Encryption/Decryption', () => {
    it('メッセージを暗号化して復号化できる', async () => {
      // Arrange
      const message = 'こんにちは、これはテストメッセージです！';
      const keyPair = await cryptoService.generateKeyPair();

      // Act
      const encrypted = await cryptoService.encryptMessage(message, keyPair.publicKey);
      const decrypted = await cryptoService.decryptMessage(encrypted, keyPair.privateKey);

      // Assert
      expect(decrypted).toBe(message);
      expect(encrypted.encryptedContent).not.toBe(message);
      expect(encrypted.encryptedKey).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
    });

    it('長いメッセージも暗号化できる', async () => {
      // Arrange
      const longMessage = 'A'.repeat(10000); // 10KB message
      const keyPair = await cryptoService.generateKeyPair();

      // Act
      const encrypted = await cryptoService.encryptMessage(longMessage, keyPair.publicKey);
      const decrypted = await cryptoService.decryptMessage(encrypted, keyPair.privateKey);

      // Assert
      expect(decrypted).toBe(longMessage);
    });

    it('異なる鍵では復号化できない', async () => {
      // Arrange
      const message = 'Secret message';
      const keyPair1 = await cryptoService.generateKeyPair();
      const keyPair2 = await cryptoService.generateKeyPair();

      // Act
      const encrypted = await cryptoService.encryptMessage(message, keyPair1.publicKey);

      // Assert
      await expect(
        cryptoService.decryptMessage(encrypted, keyPair2.privateKey)
      ).rejects.toThrow();
    });

    it('同じメッセージでも毎回異なる暗号文になる', async () => {
      // Arrange
      const message = 'Same message';
      const keyPair = await cryptoService.generateKeyPair();

      // Act
      const encrypted1 = await cryptoService.encryptMessage(message, keyPair.publicKey);
      const encrypted2 = await cryptoService.encryptMessage(message, keyPair.publicKey);

      // Assert
      expect(encrypted1.encryptedContent).not.toBe(encrypted2.encryptedContent);
      expect(encrypted1.encryptedKey).not.toBe(encrypted2.encryptedKey);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // But both should decrypt to the same message
      const decrypted1 = await cryptoService.decryptMessage(encrypted1, keyPair.privateKey);
      const decrypted2 = await cryptoService.decryptMessage(encrypted2, keyPair.privateKey);
      expect(decrypted1).toBe(message);
      expect(decrypted2).toBe(message);
    });

    it('絵文字を含むメッセージも暗号化できる', async () => {
      // Arrange
      const message = 'Hello 👋 World 🌍! 日本語も OK 🇯🇵';
      const keyPair = await cryptoService.generateKeyPair();

      // Act
      const encrypted = await cryptoService.encryptMessage(message, keyPair.publicKey);
      const decrypted = await cryptoService.decryptMessage(encrypted, keyPair.privateKey);

      // Assert
      expect(decrypted).toBe(message);
    });
  });

  describe('Key Storage', () => {
    it('秘密鍵を保存して取得できる', async () => {
      // Arrange
      const userId = 'user-123';
      const keyPair = await cryptoService.generateKeyPair();

      // Mock localStorage for testing
      const mockStorage = new Map<string, string>();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        mockStorage.set(key, value);
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        return mockStorage.get(key) || null;
      });

      // Act
      await cryptoService.storePrivateKey(userId, keyPair.privateKey);
      const retrievedKey = await cryptoService.getPrivateKey(userId);

      // Assert
      expect(retrievedKey).toBe(keyPair.privateKey);
    });
  });

  describe('Error Handling', () => {
    it('不正な公開鍵で暗号化しようとするとエラー', async () => {
      // Arrange
      const message = 'Test message';
      const invalidPublicKey = 'invalid-key-data';

      // Act & Assert
      await expect(
        cryptoService.encryptMessage(message, invalidPublicKey)
      ).rejects.toThrow();
    });

    it('不正な暗号化データで復号化しようとするとエラー', async () => {
      // Arrange
      const invalidEncrypted = {
        encryptedContent: 'invalid-data',
        encryptedKey: 'invalid-key',
        iv: 'invalid-iv'
      };
      const keyPair = await cryptoService.generateKeyPair();

      // Act & Assert
      await expect(
        cryptoService.decryptMessage(invalidEncrypted, keyPair.privateKey)
      ).rejects.toThrow();
    });

    it('改ざんされたデータは復号化できない', async () => {
      // Arrange
      const message = 'Original message';
      const keyPair = await cryptoService.generateKeyPair();
      const encrypted = await cryptoService.encryptMessage(message, keyPair.publicKey);

      // Tamper with the encrypted content
      const tamperedEncrypted = {
        ...encrypted,
        encryptedContent: encrypted.encryptedContent.substring(0, encrypted.encryptedContent.length - 4) + 'XXXX'
      };

      // Act & Assert
      await expect(
        cryptoService.decryptMessage(tamperedEncrypted, keyPair.privateKey)
      ).rejects.toThrow();
    });
  });
});