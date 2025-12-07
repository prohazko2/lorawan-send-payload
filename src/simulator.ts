import { setTimeout as delay } from "node:timers/promises";

import { config } from "./config.ts";
import { deviceState } from "./device-state.ts";
import {
  createJoinRequest,
  processJoinAccept,
  createDataUplink,
  processDataDownlink,
} from "./lorawan.ts";
import {
  sendPullData,
  sendPushData,
  setupMessageHandler,
  bindClient,
  onClientError,
} from "./packet-forwarder.ts";

import type { FrequencyPlan } from "./frequency-plans.ts";
import { getFrequencyPlan, getRandomUplinkChannel } from "./frequency-plans.ts";

function defaultPayloadGenerator(): Buffer {
  return Buffer.from(`hello: ${new Date().toISOString()}`);
}

let payloadGenerator: (() => Buffer) | null = null;
let payloadGeneratorLoaded = false;

async function loadPayloadGenerator(): Promise<() => Buffer> {
  if (payloadGeneratorLoaded) {
    return payloadGenerator || defaultPayloadGenerator;
  }

  payloadGeneratorLoaded = true;

  try {
    const payloadModule = await import("../uplink.ts");
    if (
      payloadModule &&
      typeof payloadModule.generateUplinkPayload === "function"
    ) {
      payloadGenerator = payloadModule.generateUplinkPayload;
      console.log("✓ Custom uplink payload generator loaded");
      return payloadGenerator;
    }
  } catch (error) {
    console.warn(error instanceof Error ? error.message : String(error));
    console.warn(`Using default payload generator`);
  }

  payloadGenerator = defaultPayloadGenerator;
  return payloadGenerator;
}

export async function sendUplink(frequencyPlan: FrequencyPlan) {
  if (!deviceState.activated) {
    console.log(`sendUplink: device not activated yet`);
    return;
  }
  const generator = await loadPayloadGenerator();
  const payload = generator();
  const phyPayload = createDataUplink(payload);
  if (phyPayload) {
    const uplinkFreq = getRandomUplinkChannel(frequencyPlan);
    console.log(
      `Sending uplink (FCnt: ${
        deviceState.fCntUp - 1
      }, Freq: ${uplinkFreq} MHz): ${payload.toString()}`
    );
    sendPushData(
      phyPayload,
      -100,
      5.0,
      uplinkFreq,
      frequencyPlan.defaultDatarate
    );
  }
}

// Инициализация
export async function _start() {
  // Получаем частотный план
  const frequencyPlan = getFrequencyPlan(config.frequencyPlan);
  if (!frequencyPlan) {
    console.error(`Error: Unknown frequency plan '${config.frequencyPlan}'`);
    console.error(
      `Available plans: EU868, RU864, US915, AS923-1, AS923-2, AS923-3, AS923-4, CN470, IN865, KR920`
    );
    process.exit(1);
    return; // TypeScript guard
  }

  console.log("LoRaWAN Device Simulator");
  console.log("========================");
  console.log(`Gateway: ${config.gatewayHost}:${config.gatewayPort}`);
  console.log(`Device EUI: ${config.deviceEUI}`);
  console.log(`App EUI: ${config.appEUI}`);
  console.log(
    `Frequency Plan: ${frequencyPlan.name} (${frequencyPlan.description})`
  );
  console.log(`  Default Uplink: ${frequencyPlan.defaultUplinkChannel} MHz`);
  console.log(`  RX2 Frequency: ${frequencyPlan.rx2Frequency} MHz`);
  console.log(`  RX1 Offset: ${frequencyPlan.rx1Offset}`);
  console.log("");

  sendPullData();
  await delay(5_000);

  // Отправка Join Request
  console.log("Sending Join Request...");
  const devNonce = Math.floor(Math.random() * 65536);
  deviceState.devNonce = devNonce;
  const joinRequest = createJoinRequest(
    config.deviceEUI,
    config.appEUI,
    devNonce
  );
  const joinFreq = getRandomUplinkChannel(frequencyPlan);
  sendPushData(joinRequest, -100, 5.0, joinFreq, frequencyPlan.defaultDatarate);

  setInterval(() => {
    sendPullData();
  }, 10_000);

  setInterval(async () => {
    await sendUplink(frequencyPlan);
  }, config.uplinkInterval);
}

// Настройка обработчика сообщений
setupMessageHandler(async (phyPayload: Buffer) => {
  // Обработка downlink
  if (deviceState.activated) {
    processDataDownlink(phyPayload);
  } else {
    // Возможно Join Accept
    const res = processJoinAccept(phyPayload);
    if (res) {
      await delay(2_000);
      const frequencyPlan = getFrequencyPlan(config.frequencyPlan);
      await sendUplink(frequencyPlan!);
    }
  }
});

// Обработка ошибок
onClientError((err: Error) => {
  console.error("UDP error:", err);
  process.exit(1);
});

export function start() {
  return new Promise((resolve) => {
    bindClient(() => {
      console.log("UDP client bound");
      _start();
      resolve(null);
    });
  });
}
