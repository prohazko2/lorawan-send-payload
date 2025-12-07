import { aes128Encrypt, aes128Decrypt, aesCmac } from './crypto.ts';
import { hexToBytes, hexToEui64, bytesToHex } from './utils.ts';
import { deviceState } from './device-state.ts';
import { config } from './config.ts';

// LoRaWAN MIC вычисление
export function calculateMIC(
  key: Buffer,
  mhdr: number,
  devAddr: Buffer,
  fCnt: number,
  fOpts: Buffer,
  dir: number,
  payload: Buffer
): Buffer {
  const b0 = Buffer.alloc(16);
  b0[0] = 0x49;
  b0[1] = 0x00;
  b0[2] = 0x00;
  b0[3] = 0x00;
  b0[4] = dir;
  b0[5] = devAddr[3];
  b0[6] = devAddr[2];
  b0[7] = devAddr[1];
  b0[8] = devAddr[0];
  b0[9] = (fCnt >> 8) & 0xFF;
  b0[10] = fCnt & 0xFF;
  b0[11] = 0x00;
  b0[12] = 0x00;
  b0[13] = 0x00;
  b0[14] = 0x00;
  b0[15] = payload.length + fOpts.length;
  
  const data = Buffer.concat([
    Buffer.from([mhdr]),
    devAddr,
    Buffer.from([(fCnt >> 8) & 0xFF, fCnt & 0xFF]),
    fOpts,
    payload
  ]);
  
  return aesCmac(key, Buffer.concat([b0, data]));
}

// LoRaWAN шифрование payload
export function encryptPayload(
  key: Buffer,
  devAddr: Buffer,
  fCnt: number,
  dir: number,
  payload: Buffer
): Buffer {
  const blockSize = 16;
  const encrypted = Buffer.alloc(payload.length);
  
  for (let i = 0; i < payload.length; i += blockSize) {
    const ai = Buffer.alloc(16);
    ai[0] = 0x01;
    ai[1] = 0x00;
    ai[2] = 0x00;
    ai[3] = 0x00;
    ai[4] = dir;
    ai[5] = devAddr[3];
    ai[6] = devAddr[2];
    ai[7] = devAddr[1];
    ai[8] = devAddr[0];
    ai[9] = (fCnt >> 8) & 0xFF;
    ai[10] = fCnt & 0xFF;
    ai[11] = 0x00;
    ai[12] = 0x00;
    ai[13] = 0x00;
    ai[14] = Math.floor(i / blockSize) + 1;
    ai[15] = 0x00;
    
    const s = aes128Encrypt(key, ai);
    const end = Math.min(i + blockSize, payload.length);
    for (let j = i; j < end; j++) {
      encrypted[j] = payload[j] ^ s[j % blockSize];
    }
  }
  
  return encrypted;
}

// LoRaWAN дешифрование payload
export function decryptPayload(
  key: Buffer,
  devAddr: Buffer,
  fCnt: number,
  dir: number,
  payload: Buffer
): Buffer {
  return encryptPayload(key, devAddr, fCnt, dir, payload); // XOR симметричен
}

// MIC для Join Request (использует CMAC напрямую)
function calculateJoinRequestMIC(
  key: Buffer,
  mhdr: number,
  joinEUI: Buffer,
  devEUI: Buffer,
  devNonce: number
): Buffer {
  const data = Buffer.concat([
    Buffer.from([mhdr]),
    joinEUI,
    devEUI,
    Buffer.from([devNonce & 0xFF, (devNonce >> 8) & 0xFF])
  ]);
  return aesCmac(key, data).slice(0, 4);
}

// Создание Join Request
export function createJoinRequest(devEUI: string, appEUI: string, devNonce: number): Buffer {
  const mhdr = 0x00; // Join Request
  const joinEUI = hexToEui64(appEUI);
  const deviceEUI = hexToEui64(devEUI);
  const appKey = hexToBytes(config.appKey);
  console.log('createJoinRequest joinEUI', joinEUI);
  console.log('createJoinRequest deviceEUI', deviceEUI);
  console.log('createJoinRequest appKey', appKey.length, appKey);

  
  // MIC для Join Request использует appKey и другой формат
  const mic = calculateJoinRequestMIC(appKey, mhdr, joinEUI, deviceEUI, devNonce);
  
  const payload = Buffer.concat([
    joinEUI,
    deviceEUI,
    Buffer.from([devNonce & 0xFF, (devNonce >> 8) & 0xFF])
  ]);
  
  return Buffer.concat([Buffer.from([mhdr]), payload, mic]);
}

// MIC для Join Accept (вычисляется на зашифрованных данных)
function calculateJoinAcceptMIC(key: Buffer, mhdr: number, encrypted: Buffer): Buffer {
  const data = Buffer.concat([Buffer.from([mhdr]), encrypted]);
  return aesCmac(key, data).slice(0, 4);
}

// Вычисление ключей из Join Accept
function deriveKey(
  appKey: Buffer,
  type: number,
  appNonce: Buffer,
  netID: Buffer,
  devAddr: Buffer
): Buffer {
  const key = Buffer.alloc(16);
  key[0] = type;
  key.set(appNonce, 1);
  key.set(netID, 4);
  key.set(devAddr, 7);
  key[11] = 0x00;
  key[12] = 0x00;
  key[13] = 0x00;
  key[14] = 0x00;
  key[15] = 0x00;
  
  return aes128Encrypt(appKey, key);
}

// Обработка Join Accept
export function processJoinAccept(data: Buffer): boolean {
  if (data.length < 12) {
    console.error('Invalid Join Accept length');
    return false;
  }
  
  const mhdr = data[0];
  if ((mhdr & 0xE0) !== 0x20) { // Join Accept
    console.error('Not a Join Accept message');
    return false;
  }
  
  const appKey = hexToBytes(config.appKey);
  const encrypted = data.slice(1, -4);
  const mic = data.slice(-4);
  
  // Проверка MIC (на зашифрованных данных)
  const calculatedMIC = calculateJoinAcceptMIC(appKey, mhdr, encrypted);
  if (!mic.equals(calculatedMIC)) {
    console.error('Join Accept MIC verification failed');
    return false;
  }
  
  // Дешифрование Join Accept (дополняем до 16 байт для AES)
  const padded = Buffer.alloc(16);
  encrypted.copy(padded);
  const decrypted = aes128Decrypt(appKey, padded);
  
  const appNonce = decrypted.slice(0, 3);
  const netID = decrypted.slice(3, 6);
  const devAddr = decrypted.slice(6, 10);
  const dlSettings = decrypted[10];
  const rxDelay = decrypted[11];
  
  // Вычисление ключей
  const nwkSKey = deriveKey(appKey, 0x01, appNonce, netID, devAddr);
  const appSKey = deriveKey(appKey, 0x02, appNonce, netID, devAddr);
  
  deviceState.devAddr = devAddr;
  deviceState.nwkSKey = nwkSKey;
  deviceState.appSKey = appSKey;
  deviceState.rx1Delay = rxDelay || 1;
  deviceState.activated = true;
  deviceState.fCntUp = 0;
  deviceState.fCntDown = 0;
  
  console.log('✓ Device activated via OTAA');
  console.log(`  DevAddr: ${bytesToHex(devAddr)}`);
  console.log(`  NwkSKey: ${bytesToHex(nwkSKey)}`);
  console.log(`  AppSKey: ${bytesToHex(appSKey)}`);
  
  return true;
}

// Создание Data uplink сообщения
export function createDataUplink(payload: string | Buffer): Buffer | null {
  if (!deviceState.activated || !deviceState.devAddr || !deviceState.appSKey || !deviceState.nwkSKey) {
    console.error('Device not activated');
    return null;
  }
  
  const mhdr = 0x40; // Unconfirmed Data Up
  const fCtrl = 0x00; // ADR=0, ACK=0, ADRACKReq=0, ClassB=0, FOptsLen=0
  const fOpts = Buffer.alloc(0);
  
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;
  
  const encryptedPayload = encryptPayload(
    deviceState.appSKey,
    deviceState.devAddr,
    deviceState.fCntUp,
    0, // uplink
    payloadBuffer
  );
  
  const fhdr = Buffer.concat([
    deviceState.devAddr,
    Buffer.from([(deviceState.fCntUp >> 8) & 0xFF, deviceState.fCntUp & 0xFF]),
    Buffer.from([fCtrl]),
    fOpts
  ]);
  
  const mic = calculateMIC(
    deviceState.nwkSKey,
    mhdr,
    deviceState.devAddr,
    deviceState.fCntUp,
    fOpts,
    0, // uplink
    encryptedPayload
  ).slice(0, 4); // MIC - первые 4 байта
  
  const phyPayload = Buffer.concat([
    Buffer.from([mhdr]),
    fhdr,
    encryptedPayload,
    mic
  ]);
  
  deviceState.fCntUp++;
  
  return phyPayload;
}

// Обработка Data downlink сообщения
export function processDataDownlink(data: Buffer): boolean {
  if (!deviceState.activated || !deviceState.devAddr || !deviceState.appSKey || !deviceState.nwkSKey) {
    return false;
  }
  
  const mhdr = data[0];
  if ((mhdr & 0xE0) !== 0x60 && (mhdr & 0xE0) !== 0x80) { // Data Down
    return false;
  }
  
  const devAddr = data.slice(1, 5);
  if (!devAddr.equals(deviceState.devAddr)) {
    console.error('DevAddr mismatch');
    return false;
  }
  
  const fCnt = (data[5] << 8) | data[6];
  const fCtrl = data[7];
  const fOptsLen = fCtrl & 0x0F;
  const fOpts = data.slice(8, 8 + fOptsLen);
  const payload = data.slice(8 + fOptsLen, -4);
  const mic = data.slice(-4);
  
  // Проверка MIC
  const calculatedMIC = calculateMIC(
    deviceState.nwkSKey,
    mhdr,
    devAddr,
    fCnt,
    fOpts,
    1, // downlink
    payload
  ).slice(0, 4); // MIC - первые 4 байта
  
  if (!mic.equals(calculatedMIC)) {
    console.error('MIC verification failed');
    return false;
  }
  
  const decryptedPayload = decryptPayload(
    deviceState.appSKey,
    devAddr,
    fCnt,
    1, // downlink
    payload
  );
  
  deviceState.fCntDown = fCnt + 1;
  
  console.log(`✓ Downlink received: ${decryptedPayload.toString('hex')}`);
  console.log(`  FCnt: ${fCnt}`);
  
  return true;
}

