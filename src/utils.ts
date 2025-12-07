// Утилиты для работы с байтами
export function hexToBytes(hex: string): Buffer {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return Buffer.from(bytes);
}

export function hexToEui64(hex: string): Buffer {
  const bytes = hexToBytes(hex);
  return Buffer.from(bytes).reverse();
}

export function bytesToHex(buffer: Buffer): string {
  return buffer.toString('hex');
}

