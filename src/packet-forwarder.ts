import * as dgram from "node:dgram";

import { config } from "./config.ts";
import type { PacketForwarderMessage, PacketForwarderRxpk } from "./types.ts";

// UDP клиент
const client = dgram.createSocket("udp4");

// Packet Forwarder протокол
export function sendPullData(): void {
  const token = Math.floor(Math.random() * 65536);
  const header = Buffer.alloc(4);
  
  header.writeUInt8(0x02, 0); // Protocol version = 2
  header.writeUInt16LE(token, 1); // Token in bytes 1-2 (little-endian)
  header.writeUInt8(0x02, 3); // PULL_DATA identifier

  const data = Buffer.concat([
    header,
    Buffer.from(config.gatewayEUI, "hex"),
  ]);
  
  // Логирование сырого исходящего UDP пакета (PULL_DATA)
  console.log(`UDP TX [${data.length} bytes]: ${data.toString('hex')}`);
  console.log("sendPullData token:", token);
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
  header.writeUInt16LE(token, 1); // Token in bytes 1-2 (little-endian)
  header.writeUInt8(0x00, 3); // PUSH_DATA identifier
  //console.log("z", Buffer.from(config.gatewayEUI, "hex"));

  const data = Buffer.concat([
    header,
    Buffer.from(config.gatewayEUI, "hex"),
    packet,
  ]);
  
  // Логирование сырого исходящего UDP пакета (PUSH_DATA)
  console.log(`UDP TX [${data.length} bytes]: ${data.toString('hex')}`);
  client.send(
    data,
    config.gatewayPort,
    config.gatewayAddress,
    (err: Error | null, b: number) => {
      console.error("Send join:", err, b);
    }
  );
}

// Отправка TX_ACK после получения PULL_RESP с downlink
export function sendTxAck(token: number): void {
  const header = Buffer.alloc(4);
  header.writeUInt8(0x02, 0); // Protocol version = 2
  header.writeUInt16LE(token, 1); // Token в bytes 1-2 (little-endian, тот же что в PULL_RESP)
  header.writeUInt8(0x05, 3); // TX_ACK identifier

  // TX_ACK payload: {"txpk_ack": {"error": "NONE"}}
  const payload = JSON.stringify({
    txpk_ack: {
      error: "NONE"
    }
  });
  const packet = Buffer.from(payload);

  const data = Buffer.concat([
    header,
    Buffer.from(config.gatewayEUI, "hex"),
    packet,
  ]);

  // Логирование сырого исходящего UDP пакета (TX_ACK)
  console.log(`UDP TX [${data.length} bytes]: ${data.toString('hex')}`);
  console.log("sendTxAck token:", token);
  client.send(
    data,
    config.gatewayPort,
    config.gatewayAddress,
    (err: Error | null) => {
      if (err) {
        console.error("Send TX_ACK error:", err);
      } else {
        console.log("TX_ACK sent successfully");
      }
    }
  );
}

export function setupMessageHandler(
  onPullResp: (phyPayload: Buffer) => void
): void {
  // Обработка входящих сообщений от gateway
  client.on("message", (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    // Логирование сырого входящего UDP пакета
    console.log(`UDP RX [${msg.length} bytes]: ${msg.toString('hex')}`);
    console.log('message', msg.length, msg);

    if (msg.length < 4) return;

    const protocolVersion = msg[0]; // Protocol version (should be 0x02)
    const token = msg.readUInt16LE(1); // Token in bytes 1-2 (little-endian)
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
          
          // Отправляем TX_ACK Network Server'у с тем же token
          sendTxAck(token);
          
          // Обрабатываем downlink (JoinAccept или Data Downlink)
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
