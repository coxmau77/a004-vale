import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, "..", "assets");

function createWav(filename, freq, duration, sampleRate = 44100) {
  const numSamples = Math.floor(sampleRate * duration);
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  const writeStr = (s) => { buffer.write(s, offset); offset += 4; };
  const writeU16 = (v) => { buffer.writeUInt16LE(v, offset); offset += 2; };
  const writeU32 = (v) => { buffer.writeUInt32LE(v, offset); offset += 4; };

  writeStr("RIFF");
  writeU32(fileSize);
  writeStr("WAVE");
  writeStr("fmt ");
  writeU32(16);
  writeU16(1);
  writeU16(numChannels);
  writeU32(sampleRate);
  writeU32(byteRate);
  writeU16(blockAlign);
  writeU16(bitsPerSample);
  writeStr("data");
  writeU32(dataSize);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * freq * t);
    const value = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.floor(value * 32767 * 0.3), offset);
    offset += 2;
  }

  fs.writeFileSync(filename, buffer);
  console.log(`  ✓ ${path.basename(filename)} (${freq}Hz, ${duration}s)`);
}

console.log("Generando assets placeholder...\n");

// Audio
console.log("Audio:");
createWav(path.join(ASSETS, "audio", "rain-loop.wav"), 180, 8);

console.log("\nAssets generados correctamente.");
console.log("Reemplázalos con archivos reales (.webp, .mp4, .mp3) en producción.");
