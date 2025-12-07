// Интерфейс для частотного плана
export interface FrequencyPlan {
  name: string;
  description: string;
  uplinkChannels: number[]; // Частоты для uplink в MHz
  downlinkChannels: number[]; // Частоты для downlink в MHz
  rx1Offset: number; // RX1 offset (обычно 0 или 5)
  rx2Frequency: number; // RX2 частота в MHz
  defaultUplinkChannel: number; // Канал по умолчанию для uplink
  defaultDatarate: string; // Data rate по умолчанию
  maxPower: number; // Максимальная мощность в dBm
}

// Частотные планы LoRaWAN
export const frequencyPlans: Record<string, FrequencyPlan> = {
  // EU868 - Европейский частотный план
  EU868: {
    name: "EU868",
    description: "European 863-870 MHz ISM Band",
    uplinkChannels: [868.1, 868.3, 868.5, 867.1, 867.3, 867.5, 867.7, 867.9],
    downlinkChannels: [868.1, 868.3, 868.5, 867.1, 867.3, 867.5, 867.7, 867.9],
    rx1Offset: 0,
    rx2Frequency: 869.525,
    defaultUplinkChannel: 868.1,
    defaultDatarate: "SF7BW125",
    maxPower: 14,
  },

  // RU864 - Российский частотный план
  RU864: {
    name: "RU864",
    description: "Russian 864-870 MHz ISM Band",
    uplinkChannels: [868.9, 869.1, 864.1, 864.3],
    downlinkChannels: [868.9, 869.1, 864.1, 864.3],
    rx1Offset: 5,
    rx2Frequency: 869.1,
    defaultUplinkChannel: 868.9,
    defaultDatarate: "SF7BW125",
    maxPower: 20,
  },

  // US915 - Североамериканский частотный план
  US915: {
    name: "US915",
    description: "North American 902-928 MHz ISM Band",
    uplinkChannels: [
      902.3, 902.5, 902.7, 902.9, 903.1, 903.3, 903.5, 903.7, 903.9, 904.1,
      904.3, 904.5, 904.7, 904.9, 905.1, 905.3, 905.5, 905.7, 905.9, 906.1,
      906.3, 906.5, 906.7, 906.9, 907.1, 907.3, 907.5, 907.7, 907.9, 908.1,
      908.3, 908.5, 908.7, 908.9, 909.1, 909.3, 909.5, 909.7, 909.9, 910.1,
      910.3, 910.5, 910.7, 910.9, 911.1, 911.3, 911.5, 911.7, 911.9, 912.1,
      912.3, 912.5, 912.7, 912.9, 913.1, 913.3, 913.5, 913.7, 913.9, 914.1,
      914.3, 914.5, 914.7, 914.9,
    ],
    downlinkChannels: [923.3, 923.9, 924.5, 925.1, 925.7, 926.3, 926.9, 927.5],
    rx1Offset: 0,
    rx2Frequency: 923.3,
    defaultUplinkChannel: 902.3,
    defaultDatarate: "SF10BW125",
    maxPower: 30,
  },

  // AS923 - Азиатский частотный план (вариант 1)
  AS923_1: {
    name: "AS923-1",
    description: "Asian 923 MHz ISM Band (Group 1)",
    uplinkChannels: [923.2, 923.4, 923.6, 923.8, 924.0, 924.2, 924.4, 924.6],
    downlinkChannels: [923.2, 923.4, 923.6, 923.8, 924.0, 924.2, 924.4, 924.6],
    rx1Offset: 0,
    rx2Frequency: 923.2,
    defaultUplinkChannel: 923.2,
    defaultDatarate: "SF7BW125",
    maxPower: 16,
  },

  // AS923-2 - Азиатский частотный план (вариант 2)
  AS923_2: {
    name: "AS923-2",
    description: "Asian 923 MHz ISM Band (Group 2)",
    uplinkChannels: [921.4, 921.6, 921.8, 922.0, 922.2, 922.4, 922.6, 922.8],
    downlinkChannels: [921.4, 921.6, 921.8, 922.0, 922.2, 922.4, 922.6, 922.8],
    rx1Offset: 0,
    rx2Frequency: 921.4,
    defaultUplinkChannel: 921.4,
    defaultDatarate: "SF7BW125",
    maxPower: 16,
  },

  // AS923-3 - Азиатский частотный план (вариант 3)
  AS923_3: {
    name: "AS923-3",
    description: "Asian 923 MHz ISM Band (Group 3)",
    uplinkChannels: [916.6, 916.8, 917.0, 917.2, 917.4, 917.6, 917.8, 918.0],
    downlinkChannels: [916.6, 916.8, 917.0, 917.2, 917.4, 917.6, 917.8, 918.0],
    rx1Offset: 0,
    rx2Frequency: 916.6,
    defaultUplinkChannel: 916.6,
    defaultDatarate: "SF7BW125",
    maxPower: 16,
  },

  // AS923-4 - Азиатский частотный план (вариант 4)
  AS923_4: {
    name: "AS923-4",
    description: "Asian 923 MHz ISM Band (Group 4)",
    uplinkChannels: [917.5, 917.7, 917.9, 918.1, 918.3, 918.5, 918.7, 918.9],
    downlinkChannels: [917.5, 917.7, 917.9, 918.1, 918.3, 918.5, 918.7, 918.9],
    rx1Offset: 0,
    rx2Frequency: 917.5,
    defaultUplinkChannel: 917.5,
    defaultDatarate: "SF7BW125",
    maxPower: 16,
  },

  // CN470 - Китайский частотный план
  CN470: {
    name: "CN470",
    description: "Chinese 470-510 MHz Band",
    uplinkChannels: [
      470.3, 470.5, 470.7, 470.9, 471.1, 471.3, 471.5, 471.7, 471.9, 472.1,
      472.3, 472.5, 472.7, 472.9, 473.1, 473.3, 473.5, 473.7, 473.9, 474.1,
      474.3, 474.5, 474.7, 474.9, 475.1, 475.3, 475.5, 475.7, 475.9, 476.1,
      476.3, 476.5, 476.7, 476.9, 477.1, 477.3, 477.5, 477.7, 477.9, 478.1,
      478.3, 478.5, 478.7, 478.9, 479.1, 479.3, 479.5, 479.7, 479.9, 480.1,
      480.3, 480.5, 480.7, 480.9, 481.1, 481.3, 481.5, 481.7, 481.9, 482.1,
      482.3, 482.5, 482.7, 482.9, 483.1, 483.3, 483.5, 483.7, 483.9, 484.1,
      484.3, 484.5, 484.7, 484.9, 485.1, 485.3, 485.5, 485.7, 485.9, 486.1,
      486.3, 486.5, 486.7, 486.9, 487.1, 487.3, 487.5, 487.7, 487.9, 488.1,
      488.3, 488.5, 488.7, 488.9, 489.1, 489.3, 489.5, 489.7, 489.9, 490.1,
      490.3, 490.5, 490.7, 490.9, 491.1, 491.3, 491.5, 491.7, 491.9, 492.1,
      492.3, 492.5, 492.7, 492.9, 493.1, 493.3, 493.5, 493.7, 493.9, 494.1,
      494.3, 494.5, 494.7, 494.9, 495.1, 495.3, 495.5, 495.7, 495.9, 496.1,
      496.3, 496.5, 496.7, 496.9, 497.1, 497.3, 497.5, 497.7, 497.9, 498.1,
      498.3, 498.5, 498.7, 498.9, 499.1, 499.3, 499.5, 499.7, 499.9, 500.1,
      500.3, 500.5, 500.7, 500.9, 501.1, 501.3, 501.5, 501.7, 501.9, 502.1,
      502.3, 502.5, 502.7, 502.9, 503.1, 503.3, 503.5, 503.7, 503.9, 504.1,
      504.3, 504.5, 504.7, 504.9, 505.1, 505.3, 505.5, 505.7, 505.9, 506.1,
      506.3, 506.5, 506.7, 506.9, 507.1, 507.3, 507.5, 507.7, 507.9, 508.1,
      508.3, 508.5, 508.7, 508.9, 509.1, 509.3, 509.5, 509.7, 509.9,
    ],
    downlinkChannels: [500.3, 500.5, 500.7, 500.9, 501.1, 501.3, 501.5, 501.7],
    rx1Offset: 0,
    rx2Frequency: 500.3,
    defaultUplinkChannel: 470.3,
    defaultDatarate: "SF7BW125",
    maxPower: 14,
  },

  // IN865 - Индийский частотный план
  IN865: {
    name: "IN865",
    description: "Indian 865-867 MHz ISM Band",
    uplinkChannels: [865.0625, 865.4025, 865.985],
    downlinkChannels: [865.0625, 865.4025, 865.985],
    rx1Offset: 0,
    rx2Frequency: 866.55,
    defaultUplinkChannel: 865.0625,
    defaultDatarate: "SF7BW125",
    maxPower: 30,
  },

  // KR920 - Корейский частотный план
  KR920: {
    name: "KR920",
    description: "Korean 920-923 MHz ISM Band",
    uplinkChannels: [922.1, 922.3, 922.5, 922.7, 922.9, 923.1, 923.3],
    downlinkChannels: [922.1, 922.3, 922.5, 922.7, 922.9, 923.1, 923.3],
    rx1Offset: 0,
    rx2Frequency: 922.1,
    defaultUplinkChannel: 922.1,
    defaultDatarate: "SF7BW125",
    maxPower: 14,
  },
};

// Получить частотный план по имени
export function getFrequencyPlan(name: string): FrequencyPlan | null {
  const plan = frequencyPlans[name.toUpperCase()];
  return plan || null;
}

// Получить список доступных частотных планов
export function getAvailableFrequencyPlans(): string[] {
  return Object.keys(frequencyPlans);
}

// Получить случайный uplink канал из плана
export function getRandomUplinkChannel(plan: FrequencyPlan): number {
  const channels = plan.uplinkChannels;
  return channels[Math.floor(Math.random() * channels.length)];
}

// Получить частоту для RX1 (uplink частота + offset)
export function getRx1Frequency(
  uplinkFreq: number,
  plan: FrequencyPlan
): number {
  // RX1 использует тот же канал, что и uplink (offset применяется на уровне сервера)
  return uplinkFreq;
}
