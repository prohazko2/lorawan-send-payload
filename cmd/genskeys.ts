import lora from "lora-packet";
import { config } from "../src/config.ts";
import { hexToBytes } from "../src/utils.ts";
import { getDevNonceBufferLe } from "../src/lorawan.ts";

const appKey = hexToBytes(config.appKey);

const xs = lora.generateSessionKeys(
  appKey,
  Buffer.from([0, 0, 0]),
  Buffer.from([0, 0, 60]),
  getDevNonceBufferLe(36383)
);

console.log(xs);
