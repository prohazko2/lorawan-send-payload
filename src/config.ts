import * as fs from "node:fs";
import * as path from "node:path";
import type { DeviceConfig, DebugConfig } from "./types.ts";

// Чтение конфигурации из файла
function loadConfigFromFile(): Partial<DeviceConfig> {
  const configPath = path.join(process.cwd(), "config.json");

  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      const fileConfig: DeviceConfig = JSON.parse(fileContent);

      // Преобразуем значения в правильные типы
      const config: Partial<DeviceConfig> = {};

      if (fileConfig.debug) {
        config.debug = fileConfig.debug;
      }

      if (fileConfig.gatewayHost !== undefined) {
        config.gatewayHost = String(fileConfig.gatewayHost);
      }
      if (fileConfig.gatewayPort !== undefined) {
        config.gatewayPort =
          typeof fileConfig.gatewayPort === "string"
            ? parseInt(fileConfig.gatewayPort, 10)
            : fileConfig.gatewayPort;
      }
      if (fileConfig.gatewayEUI !== undefined) {
        config.gatewayEUI = String(fileConfig.gatewayEUI);
      }
      if (fileConfig.deviceEUI !== undefined) {
        config.deviceEUI = String(fileConfig.deviceEUI);
      }
      if (fileConfig.appEUI !== undefined) {
        config.appEUI = String(fileConfig.appEUI);
      }
      if (fileConfig.appKey !== undefined) {
        config.appKey = String(fileConfig.appKey);
      }
      if (fileConfig.uplinkInterval !== undefined) {
        config.uplinkInterval =
          typeof fileConfig.uplinkInterval === "string"
            ? parseInt(fileConfig.uplinkInterval, 10)
            : fileConfig.uplinkInterval;
      }
      if (fileConfig.uplinkFPort !== undefined) {
        config.uplinkFPort = +fileConfig.uplinkFPort;
      }
      if (fileConfig.frequencyPlan !== undefined) {
        config.frequencyPlan = String(fileConfig.frequencyPlan);
      }

      return config;
    }
  } catch (error) {
    console.warn(
      `Warning: Could not load config.json: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return {};
}

// Загрузка конфигурации из файла
const fileConfig = loadConfigFromFile();

// Конфигурация устройства
// Приоритет: переменные окружения > config.json > значения по умолчанию
export const config: DeviceConfig = {
  debug: {
    udp: fileConfig.debug?.udp || false,
    lora: fileConfig.debug?.lora || false,
  },
  gatewayHost:
    process.env.GATEWAY_HOST ||
    fileConfig.gatewayHost ||
    "dev.rightech.io",
  gatewayPort: process.env.GATEWAY_PORT
    ? parseInt(process.env.GATEWAY_PORT, 10)
    : fileConfig.gatewayPort || 1700,
  gatewayEUI:
    process.env.GATEWAY_EUI || fileConfig.gatewayEUI || "0000000000000000",
  deviceEUI:
    process.env.DEVICE_EUI || fileConfig.deviceEUI || "0000000000000001",
  appEUI: process.env.APP_EUI || fileConfig.appEUI || "0000000000000001",
  appKey:
    process.env.APP_KEY ||
    fileConfig.appKey ||
    "00000000000000000000000000000000",
  uplinkInterval: process.env.UPLINK_INTERVAL
    ? parseInt(process.env.UPLINK_INTERVAL, 10)
    : fileConfig.uplinkInterval || 60000, // мс
  uplinkFPort: fileConfig.uplinkFPort || 1,
  frequencyPlan:
    process.env.FREQUENCY_PLAN || fileConfig.frequencyPlan || "EU868",
};
