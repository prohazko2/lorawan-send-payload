import { config } from './config.ts';
import { deviceState } from './device-state.ts';
import { createJoinRequest, processJoinAccept, createDataUplink, processDataDownlink } from './lorawan.ts';
import { sendPullData, sendPushData, setupMessageHandler, bindClient, onClientError } from './packet-forwarder.ts';
import { getFrequencyPlan, getRandomUplinkChannel } from './frequency-plans.ts';

// Инициализация
function start(): void {
  // Получаем частотный план
  const frequencyPlan = getFrequencyPlan(config.frequencyPlan);
  if (!frequencyPlan) {
    console.error(`Error: Unknown frequency plan '${config.frequencyPlan}'`);
    console.error(`Available plans: EU868, RU864, US915, AS923-1, AS923-2, AS923-3, AS923-4, CN470, IN865, KR920`);
    process.exit(1);
    return; // TypeScript guard
  }

  console.log('LoRaWAN Device Simulator');
  console.log('========================');
  console.log(`Gateway: ${config.gatewayAddress}:${config.gatewayPort}`);
  console.log(`Device EUI: ${config.deviceEUI}`);
  console.log(`App EUI: ${config.appEUI}`);
  console.log(`Frequency Plan: ${frequencyPlan.name} (${frequencyPlan.description})`);
  console.log(`  Default Uplink: ${frequencyPlan.defaultUplinkChannel} MHz`);
  console.log(`  RX2 Frequency: ${frequencyPlan.rx2Frequency} MHz`);
  console.log(`  RX1 Offset: ${frequencyPlan.rx1Offset}`);
  console.log('');
  
  // Отправка Join Request
  console.log('Sending Join Request...');
  const devNonce = Math.floor(Math.random() * 65536);
  deviceState.devNonce = devNonce;
  const joinRequest = createJoinRequest(config.deviceEUI, config.appEUI, devNonce);
  const joinFreq = getRandomUplinkChannel(frequencyPlan);
  sendPushData(joinRequest, -100, 5.0, joinFreq, frequencyPlan.defaultDatarate);
  
  // Периодическая отправка PULL_DATA
  setInterval(() => {
    sendPullData();
  }, 10_000);
  
  // Периодическая отправка uplink данных
  setInterval(() => {
    if (deviceState.activated) {
      const payload = Buffer.from('Hello LoRaWAN!');
      const phyPayload = createDataUplink(payload);
      if (phyPayload) {
        const uplinkFreq = getRandomUplinkChannel(frequencyPlan);
        console.log(`Sending uplink (FCnt: ${deviceState.fCntUp - 1}, Freq: ${uplinkFreq} MHz): ${payload.toString()}`);
        sendPushData(phyPayload, -100, 5.0, uplinkFreq, frequencyPlan.defaultDatarate);
      }
    }
  }, config.uplinkInterval);
}

// Настройка обработчика сообщений
setupMessageHandler((phyPayload: Buffer) => {
  // Обработка downlink
  if (deviceState.activated) {
    processDataDownlink(phyPayload);
  } else {
    // Возможно Join Accept
    processJoinAccept(phyPayload);
  }
});

// Запуск
bindClient(() => {
  console.log('UDP client bound');
  start();
});

// Обработка ошибок
onClientError((err: Error) => {
  console.error('UDP error:', err);
  process.exit(1);
});
