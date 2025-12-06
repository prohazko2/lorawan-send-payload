import type { DeviceState } from './types.ts';

// Состояние устройства
export const deviceState: DeviceState = {
  devAddr: null,
  nwkSKey: null,
  appSKey: null,
  devNonce: 0,
  fCntUp: 0,
  fCntDown: 0,
  activated: false,
  rx1Delay: 1, // секунды
  rx2Delay: 2, // секунды
};

