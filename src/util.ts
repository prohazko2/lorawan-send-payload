export function hasNonPrintableAscii(s: string) {
  return /[^\x20-\x7E]/.test(s);
}

export function hasNonPrintableUnicode(s: string) {
  return /[\x00-\x1F\x7F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/.test(s);
}

export function getPrintableBuf(b: Buffer): string {
  let txt = `txt: ${b.toString("utf8")}`;

  if (hasNonPrintableAscii(txt) || hasNonPrintableUnicode(txt)) {
    return `hex: ${b.toString("hex")}`;
  }

  return txt;
}
