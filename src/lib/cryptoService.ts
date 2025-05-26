/**
 * E2E Encryption Service for Direct Messages
 *
 * This service handles end-to-end encryption for direct messages using
 * Web Crypto API with RSA-OAEP for key exchange and AES-GCM for message encryption.
 */

import { eq } from 'drizzle-orm';
import { db } from './db/client';
import { profiles } from './db/schema/profile';
import { ensureCrypto } from './crypto-polyfill';

// Types
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedMessage {
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
}

export interface UserKeys {
  publicKey: string;
  privateKey?: string; // Only available for current user
}

// Constants
const RSA_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

const AES_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

export class CryptoService {
  private keyCache = new Map<string, CryptoKey>();
  private crypto: Crypto;

  constructor() {
    this.crypto = ensureCrypto();
  }

  /**
   * Generate a new key pair for a user
   */
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await this.crypto.subtle.generateKey(RSA_ALGORITHM, true, ['encrypt', 'decrypt']);

    // Export keys to storable format
    const publicKeyData = await this.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyData = await this.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: this.arrayBufferToBase64(publicKeyData),
      privateKey: this.arrayBufferToBase64(privateKeyData),
    };
  }

  /**
   * Encrypt a message for a recipient
   */
  async encryptMessage(content: string, recipientPublicKey: string): Promise<EncryptedMessage> {
    // Generate a random AES key for this message
    const aesKey = await this.crypto.subtle.generateKey(AES_ALGORITHM, true, ['encrypt', 'decrypt']);

    // Import recipient's public key
    const publicKey = await this.importPublicKey(recipientPublicKey);

    // Encrypt the AES key with recipient's RSA public key
    const exportedAesKey = await this.crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await this.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      exportedAesKey
    );

    // Generate IV for AES encryption
    const iv = this.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message with AES
    const encoder = new TextEncoder();
    const encryptedContent = await this.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      encoder.encode(content)
    );

    return {
      encryptedContent: this.arrayBufferToBase64(encryptedContent),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  /**
   * Decrypt a message using private key
   */
  async decryptMessage(encryptedData: EncryptedMessage, privateKey: string): Promise<string> {
    // Import private key
    const privKey = await this.importPrivateKey(privateKey);

    // Decrypt the AES key using RSA private key
    const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedData.encryptedKey);
    const aesKeyBuffer = await this.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privKey,
      encryptedKeyBuffer
    );

    // Import the AES key
    const aesKey = await this.crypto.subtle.importKey('raw', aesKeyBuffer, AES_ALGORITHM, false, [
      'decrypt',
    ]);

    // Decrypt the message content
    const encryptedContentBuffer = this.base64ToArrayBuffer(encryptedData.encryptedContent);
    const ivBuffer = this.base64ToArrayBuffer(encryptedData.iv);

    const decryptedContent = await this.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      aesKey,
      encryptedContentBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  }

  /**
   * Store user's public key in the database
   */
  async storePublicKey(userId: string, publicKey: string): Promise<void> {
    // In a real implementation, we would add a publicKey field to the profiles table
    // For now, this is a placeholder
    console.log(`Storing public key for user ${userId}`);
  }

  /**
   * Get user's public key from the database
   */
  async getUserPublicKey(userId: string): Promise<string | null> {
    // In a real implementation, we would fetch from the profiles table
    // For now, this is a placeholder
    console.log(`Fetching public key for user ${userId}`);
    return null;
  }

  /**
   * Store private key securely (encrypted with user's password/passkey)
   */
  async storePrivateKey(userId: string, privateKey: string): Promise<void> {
    // Private keys should be stored encrypted in secure storage
    // This could be IndexedDB with additional encryption layer
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      // In production, use more secure storage and encrypt with user's password
      localStorage.setItem(`dm_private_key_${userId}`, privateKey);
    }
  }

  /**
   * Retrieve private key from secure storage
   */
  async getPrivateKey(userId: string): Promise<string | null> {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      return localStorage.getItem(`dm_private_key_${userId}`);
    }
    return null;
  }

  // Helper methods

  private async importPublicKey(keyData: string): Promise<CryptoKey> {
    const cached = this.keyCache.get(`pub_${keyData}`);
    if (cached) return cached;

    const keyBuffer = this.base64ToArrayBuffer(keyData);

    const key = await this.crypto.subtle.importKey('spki', keyBuffer, RSA_ALGORITHM, false, ['encrypt']);

    this.keyCache.set(`pub_${keyData}`, key);
    return key;
  }

  private async importPrivateKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return this.crypto.subtle.importKey('pkcs8', keyBuffer, RSA_ALGORITHM, false, ['decrypt']);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    // Use Node.js Buffer or browser btoa
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(buffer).toString('base64');
    } else {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      // For Node.js, convert directly from Buffer
      if (typeof Buffer !== 'undefined') {
        const nodeBuffer = Buffer.from(base64, 'base64');
        // Create a new ArrayBuffer and copy the data
        const arrayBuffer = new ArrayBuffer(nodeBuffer.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < nodeBuffer.length; ++i) {
          view[i] = nodeBuffer[i];
        }
        return arrayBuffer;
      } else {
        // For browser, use atob
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    } catch (error) {
      throw new Error('Invalid base64 string: ' + error);
    }
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();
