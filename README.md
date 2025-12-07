# LoRaWAN Send Payload

Простой симулятор LoRaWAN устройства класса `A` с активацией чере `OTAA`.


## Требования

- Node.js >= 22.0.0

**⚠️** Для выполнения TypeScript без компиляции используется флаг `--experimental-strip-types`.   
Этот флаг является экспериментальным и может измениться в будущих версиях Node.js

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте файл конфигурации [config.example.json](./config.example.json):

```bash
cp config.example.json config.json
```

2. Отредактируйте `config.json`:
```json
{
  "gatewayHost": "dev.rightech.io",
  "gatewayPort": 1700,
  "gatewayEUI": "0000000000000000",
  "devEUI": "0000000000000001",
  "appKey": "00000000000000000000000000000000",
  "frequencyPlan": "RU864",
  "uplinkFPort": 1,
  "uplinkInterval": 60000
}
```

### Параметры конфигурации

- `gatewayHost` - адрес LoRaWAN gateway
- `gatewayPort` - порт LoRaWAN gateway (обычно 1700)
- `gatewayEUI` - EUI шлюза в hex формате
- `devEUI` - EUI устройства в hex формате
- `appKey` - Application Key в hex формате (32 символа)
- `uplinkFPort` - FPort для uplink сообщений (по умолчанию, если не указан в uplink.ts)
- `uplinkInterval` - интервал отправки uplink сообщений в миллисекундах
- `frequencyPlan` - частотный план (RU864, EU868), остальные не проверялись
- `debug.udp` - отладка UDP пакетов
- `debug.lora` - отладка LoRaWAN пакетов

## Запуск

```bash
npm start
```

## Генерация uplink payload

Для использования собственного payload скопируйте файл [`uplink.example.ts`](./uplink.example.ts):

```bash
cp uplink.example.ts uplink.ts
```

Далее редактируйте `uplink.ts` произвольным образом:

```ts
import type { UplinkMessage } from "./src/types.ts";

import { config } from "./src/config.ts";
import { deviceState } from "./src/device-state.ts";

export function generateUplink(): UplinkMessage {
  const t = +(Math.random() * 256 - 128).toFixed(0);
  const h = +(Math.random() * 100).toFixed(0);

  return {
    fPort: 2,
    payload: Buffer.from([t, h]),
  };
}
```

## Лицензия

MIT
