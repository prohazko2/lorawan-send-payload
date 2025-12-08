import type { UplinkMessage } from "./src/types.ts";
import { config } from "./src/config.ts";
import { deviceState } from "./src/device-state.ts";

function sin(min: number, max: number, speed = 0.01) {
  const t = (Date.now() / 1000) * speed;
  const amplitude = (max - min) / 2;
  const offset = min + amplitude;
  return +(offset + Math.sin(t) * amplitude).toFixed(0);
}

export function generateUplink(): UplinkMessage {
  const t = sin(-40, 40);
  const h = sin(20, 80);

  return {
    fPort: config.uplinkFPort,
    payload: Buffer.from([t, h]),
  };
}