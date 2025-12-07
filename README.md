# LoRaWAN Send Payload

Простой симулятор LoRaWAN устройства класса `A` с активацией чере `OTAA`.


## Требования

- Node.js >= 22.0.0

**⚠️** Для работы с TypeScript без компиляции используется флаг `--experimental-strip-types`.   
Этот флаг является экспериментальным и может измениться в будущих версиях Node.js

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте файл конфигурации:

```bash
cp config.example.json config.json
```

2. Отредактируйте `config.json`:
```json
{
  "gatewayHost": "dev.rightech.io",
  "gatewayPort": 1700,
  "gatewayEUI": "0000000000000000",
  "deviceEUI": "0000000000000001",
  "appEUI": "0000000000000001",
  "appKey": "00000000000000000000000000000000",
  "uplinkFPort": 1,
  "uplinkInterval": 60000,
  "frequencyPlan": "RU864"
}
```

### Параметры конфигурации

- `gatewayHost` - адрес LoRaWAN gateway
- `gatewayPort` - порт LoRaWAN gateway (обычно 1700)
- `gatewayEUI` - EUI шлюза в hex формате
- `deviceEUI` - EUI устройства в hex форматеpre
- `appEUI` - Application EUI в hex формате
- `appKey` - Application Key в hex формате (32 символа)
- `uplinkFPort` - FPort для uplink сообщений (по умолчанию, если не указан в uplink.ts)
- `uplinkInterval` - интервал отправки uplink сообщений в миллисекундах
- `frequencyPlan` - частотный план (EU868, RU864, US915, AS923-1, AS923-2, AS923-3, AS923-4, CN470, IN865, KR920)
- `debug.udp` - включить отладку UDP пакетов
- `debug.lora` - включить отладку LoRaWAN пакетов

## Запуск

```bash
npm start
```

## Генерация uplink payload

Для создания собственного генератора uplink payload создайте файл `uplink.ts` в корне проекта:

```ts
import type { UplinkMessage } from "./src/types.ts";

export function generateUplink(): UplinkMessage {
  return {
    fPort: 2,
    payload: Buffer.from([42, 42]),
  };
}
```

Если файл `uplink.ts` не найден, будет использован генератор по умолчанию:
```ts
export function generateUplinkDefault(): UplinkMessage {
  return {
    fPort: config.uplinkFPort,
    payload: Buffer.from(`${new Date().toISOString()}`),
  };
}
```


## Лицензия

MIT
