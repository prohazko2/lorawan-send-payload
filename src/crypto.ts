import * as crypto from 'node:crypto';

// AES-128 шифрование/дешифрование
export function aes128Encrypt(key: Buffer, plaintext: Buffer): Buffer {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}

export function aes128Decrypt(key: Buffer, ciphertext: Buffer): Buffer {
  const decipher = crypto.createDecipheriv('aes-128-ecb', key, null);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// AES-CMAC вычисление (RFC 4493)
export function aesCmac(key: Buffer, data: Buffer): Buffer {
  const blockSize = 16;
  
  // Генерация подключа K1
  const zero = Buffer.alloc(16, 0);
  const l = aes128Encrypt(key, zero);
  
  // Умножение на x в GF(2^128)
  function leftShift(buffer: Buffer): Buffer {
    const result = Buffer.from(buffer);
    let carry = 0;
    for (let i = buffer.length - 1; i >= 0; i--) {
      const newCarry = (buffer[i] & 0x80) !== 0 ? 1 : 0;
      result[i] = ((buffer[i] << 1) | carry) & 0xFF;
      carry = newCarry;
    }
    return result;
  }
  
  let k1 = leftShift(l);
  if ((l[0] & 0x80) !== 0) {
    k1[15] ^= 0x87;
  }
  
  // Генерация подключа K2
  let k2 = leftShift(k1);
  if ((k1[0] & 0x80) !== 0) {
    k2[15] ^= 0x87;
  }
  
  // Обработка данных
  let padded = Buffer.from(data);
  const isComplete = padded.length % blockSize === 0;
  
  if (!isComplete) {
    // Добавление padding
    const pad = Buffer.alloc(blockSize - (padded.length % blockSize));
    pad[0] = 0x80;
    padded = Buffer.concat([padded, pad]);
  }
  
  // XOR последнего блока с K1 или K2
  const lastBlock = padded.slice(-blockSize);
  const subkey = isComplete ? k1 : k2;
  for (let i = 0; i < blockSize; i++) {
    lastBlock[i] ^= subkey[i];
  }
  
  // CBC-MAC
  let c = Buffer.alloc(16, 0);
  for (let i = 0; i < padded.length; i += blockSize) {
    const block = padded.slice(i, i + blockSize);
    for (let j = 0; j < blockSize; j++) {
      block[j] ^= c[j];
    }
    c = aes128Encrypt(key, block);
  }
  
  return c;
}

