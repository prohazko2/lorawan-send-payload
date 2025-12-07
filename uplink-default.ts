import type { UplinkMessage } from "./src/types.ts";
import { config } from "./src/config.ts";

export function generateUplink(): UplinkMessage {
  return {
    fPort: config.uplinkFPort,
    payload: Buffer.from(`${new Date().toISOString()}`),
  };
}
