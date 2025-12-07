import { aes128Encrypt } from "./crypto.ts";
import { hexToBytes, hexToEui64, bytesToHex } from "./utils.ts";
import { deviceState } from "./device-state.ts";
import { config } from "./config.ts";

import lora from "lora-packet";

export function getDevNonceBufferLe(n: number) {
  const b = Buffer.alloc(2);
  b.writeUint16LE(n);
  return b;
}

export function getDevNonceBufferBe(n: number) {
  const b = Buffer.alloc(2);
  b.writeUint16BE(n);
  return b;
}

// Создание Join Request
export function createJoinRequest(
  devEUI: string,
  appEUI: string,
  devNonce: number
): Buffer {
  const joinEUI = hexToBytes(appEUI);
  const deviceEUI = hexToBytes(devEUI);
  const appKey = hexToBytes(config.appKey);

  console.log("createJoinRequest joinEUI", joinEUI);
  console.log("createJoinRequest deviceEUI", deviceEUI);
  console.log("createJoinRequest appKey", appKey.length, appKey);

  const packet = lora.fromFields(
    {
      MType: "Join Request",
      AppEUI: joinEUI,
      DevEUI: deviceEUI,
      DevNonce: getDevNonceBufferLe(devNonce),
    },
    appKey
  );

  console.log("createJoinRequest packet", packet.toString());
  packet.MIC = lora.calculateMIC(packet, null!, appKey);
  (packet as any)._mergeGroupFields();

  const phy = packet.getPHYPayload();
  console.log("createJoinRequest phy", phy);

  if (!phy) {
    throw new Error(`lorawan: createJoinRequest - phy payload failed`);
  }

  return phy;
}

// Обработка Join Accept
export function processJoinAccept(data: Buffer): boolean {
  if (data.length < 12) {
    console.error("Invalid Join Accept length");
    return false;
  }

  const appKey = hexToBytes(config.appKey);

  let packet: ReturnType<typeof lora.fromWire>;
  try {
    const join = lora.fromWire(data);
    const mtype = join.getMType();
    if (mtype !== "Join Accept") {
      console.error(`Not a Join Accept message, got "${mtype}"`);
      return false;
    }
    packet = lora.fromWire(lora.decryptJoinAccept(join, appKey));
  } catch (error) {
    console.error("Failed to parse Join Accept:", error);
    return false;
  }

  const { AppSKey, NwkSKey } = lora.generateSessionKeys(
    appKey,
    packet.NetID!,
    packet.AppNonce!,
    getDevNonceBufferLe(deviceState.devNonce)
  );

  deviceState.devAddr = packet.DevAddr!;
  deviceState.nwkSKey = NwkSKey!;
  deviceState.appSKey = AppSKey!;
  //deviceState.rx1Delay = packet.RxDelay!;
  deviceState.activated = true;
  deviceState.fCntUp = 0;
  deviceState.fCntDown = 0;

  console.log("✓ Device activated via OTAA");
  console.log(`  DevAddr: ${bytesToHex(deviceState.devAddr)}`);
  console.log(`  NwkSKey: ${bytesToHex(deviceState.nwkSKey)}`);
  console.log(`  AppSKey: ${bytesToHex(deviceState.appSKey)}`);

  return true;
}

// Создание Data uplink сообщения
export function createDataUplink(payload: string | Buffer): Buffer | null {
  if (
    !deviceState.activated ||
    !deviceState.devAddr ||
    !deviceState.appSKey ||
    !deviceState.nwkSKey
  ) {
    console.error("Device not activated");
    return null;
  }

  const payloadBuffer =
    typeof payload === "string" ? Buffer.from(payload) : payload;

  const p = lora.fromFields(
    {
      MType: "Unconfirmed Data Up", // (default)
      DevAddr: deviceState.devAddr,
      FCtrl: {
        ADR: false, // default = false
        ACK: false, // default = false
        ADRACKReq: false, // default = false
        FPending: false, // default = false
      },
      FCnt: 1,
      payload: payloadBuffer,
    },
    deviceState.appSKey, // AppSKey
    deviceState.nwkSKey // NwkSKey
  );
  console.log("constructedPacket.toString()=\n" + p);
  const phy = p.getPHYPayload();
  if (!phy) {
    throw new Error(`lorawan: createDataUplink - phy payload failed`);
  }

  deviceState.fCntUp++;

  return phy; //phyPayload;
}

export function processDataDownlink(data: Buffer): boolean {
  if (
    !deviceState.activated ||
    !deviceState.devAddr ||
    !deviceState.appSKey ||
    !deviceState.nwkSKey
  ) {
    return false;
  }

  throw new Error("processDataDownlink: not implemented");
}
