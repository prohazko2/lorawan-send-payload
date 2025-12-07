// LoRaWAN версия 1.0.3
export const LORAWAN_VERSION: number = 0x00; // LoRaWAN 1.0.x

export interface DebugConfig {
  udp: boolean;
  lora: boolean;
}

// Интерфейсы для конфигурации и состояния
export interface DeviceConfig {
  debug: DebugConfig;
  gatewayAddress: string;
  gatewayPort: number;
  gatewayEUI: string;
  deviceEUI: string;
  appEUI: string;
  appKey: string;
  uplinkInterval: number;
  uplinkFPort: number;
  frequencyPlan: string; // Название частотного плана (EU868, RU864, и т.д.)
}

export interface DeviceState {
  devAddr: Buffer | null;
  nwkSKey: Buffer | null;
  appSKey: Buffer | null;
  devNonce: number;
  fCntUp: number;
  fCntDown: number;
  activated: boolean;
  rx1Delay: number;
  rx2Delay: number;
}

export interface PacketForwarderRxpk {
  time: string;
  tmst: number;
  chan: number;
  rfch: number;
  freq: number;
  stat: number;
  modu: string;
  datr: string;
  codr: string;
  rssi: number;
  lsnr: number;
  size: number;
  data: string;
}

export interface PacketForwarderTxpk {
  data: string;
  [key: string]: any;
}

export interface PacketForwarderMessage {
  rxpk?: PacketForwarderRxpk[];
  txpk?: PacketForwarderTxpk;
  stat?: any;
}

