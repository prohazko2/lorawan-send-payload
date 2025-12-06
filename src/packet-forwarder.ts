import * as dgram from "node:dgram";

import { config } from "./config.ts";
import type { PacketForwarderMessage, PacketForwarderRxpk } from "./types.ts";

// UDP клиент
const client = dgram.createSocket("udp4");

// Packet Forwarder протокол
export function sendPullData(): void {
  const token = Math.floor(Math.random() * 65536);
  const message: PacketForwarderMessage = {
    stat: {
      time: new Date().toISOString(),
      lati: 0,
      long: 0,
      alti: 0,
      rxnb: 0,
      rxok: 0,
      rxfw: 0,
      ackr: 100,
      dwnb: 0,
      txnb: 0,
    },
  };

  const packet = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  console.log("sendPullData", token, message);

  header.writeUInt8(0x02, 0); // Protocol version = 2
  header.writeUInt16BE(token, 1); // Token in bytes 1-2
  header.writeUInt8(0x02, 3); // PULL_DATA identifier

  const data = Buffer.concat([
    header,
    Buffer.from(config.gatewayEUI, "hex"),
    packet,
  ]);
  client.send(
    data,
    config.gatewayPort,
    config.gatewayAddress,
    (err: Error | null) => {
      if (err) console.error("Send error:", err);
    }
  );
}

export function sendPushData(
  phyPayload: Buffer,
  rssi?: number,
  snr?: number,
  frequency?: number,
  datarate?: string
): void {
  const token = Math.floor(Math.random() * 65536);
  const rxpk: PacketForwarderRxpk = {
    time: new Date().toISOString(),
    tmst: Math.floor(Date.now() / 1000),
    chan: 0,
    rfch: 0,
    freq: frequency || 868.1,
    stat: 1,
    modu: "LORA",
    datr: datarate || "SF7BW125",
    codr: "4/5",
    rssi: rssi || -100,
    lsnr: snr || 5.0,
    size: phyPayload.length,
    data: phyPayload.toString("base64"),
  };

  const message: PacketForwarderMessage = { rxpk: [rxpk] };
  const packet = Buffer.from(JSON.stringify(message));
  console.log("sendPushData", token, message);
  const header = Buffer.alloc(4);
  header.writeUInt8(0x02, 0); // Protocol version = 2
  header.writeUInt16BE(token, 1); // Token in bytes 1-2
  header.writeUInt8(0x00, 3); // PUSH_DATA identifier
  //console.log("z", Buffer.from(config.gatewayEUI, "hex"));

  const data = Buffer.concat([
    header,
    Buffer.from(config.gatewayEUI, "hex"),
    packet,
  ]);
  client.send(
    data,
    config.gatewayPort,
    config.gatewayAddress,
    (err: Error | null, b: number) => {
      console.error("Send join:", err, b);
    }
  );
}

export function setupMessageHandler(
  onPullResp: (phyPayload: Buffer) => void
): void {
  // Обработка входящих сообщений от gateway
  client.on("message", (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    console.log('message', msg);

    if (msg.length < 4) return;

    const protocolVersion = msg[0]; // Protocol version (should be 0x02)
    const token = msg.readUInt16BE(1); // Token in bytes 1-2
    const identifier = msg[3]; // Identifier in byte 3

    console.log('message', {protocolVersion, token, identifier});


    if (identifier === 0x04) {
      // PULL_ACK
      // Gateway подтвердил PULL_DATA
      // Структура: version (1) + token (2) + identifier (1) = 4 байта
      return;
    } else if (identifier === 0x01) {
      // PUSH_ACK
      // Gateway подтвердил PUSH_DATA
      // Структура: version (1) + token (2) + identifier (1) = 4 байта
      return;
    } else if (identifier === 0x03) {
      // PULL_RESP
      // Gateway получил команду на передачу downlink
      // Структура: version (1) + token (2) + identifier (1) + JSON (начиная с байта 4)
      // JSON начинается сразу после заголовка (байт 4), без Gateway EUI
      const jsonStart = 4;
      try {
        const json: PacketForwarderMessage = JSON.parse(
          msg.slice(jsonStart).toString()
        );
        if (json.txpk) {
          const txpk = json.txpk;
          const phyPayload = Buffer.from(txpk.data, "base64");
          onPullResp(phyPayload);
        }
      } catch (e) {
        console.error("Error parsing PULL_RESP:", e);
      }
    }
  });
}

export function bindClient(callback: () => void): void {
  client.bind(callback);
}

export function onClientError(handler: (err: Error) => void): void {
  client.on("error", handler);
}
